/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import {
  IContainer,
  IIndexable,
  mergeDistinct,
  nextId,
  Writable,
  Constructable,
  IDisposable,
  PLATFORM,
} from '@aurelia/kernel';
import {
  PropertyBinding,
} from '../binding/property-binding';
import {
  HooksDefinition,
  PartialCustomElementDefinitionParts,
} from '../definitions';
import {
  INode,
  INodeSequence,
  IRenderLocation
} from '../dom';
import {
  LifecycleFlags,
} from '../flags';
import {
  IBinding,
  IController,
  ILifecycle,
  IViewModel,
  ViewModelKind,
  MountStrategy,
  IViewFactory,
  ISyntheticView,
  ICustomAttributeController,
  IDryCustomElementController,
  IContextualCustomElementController,
  ICompiledCustomElementController,
  ICustomElementController,
  ICustomElementViewModel,
  ICustomAttributeViewModel,
  IActivationHooks,
  ICompileHooks,
  IHydratedController,
  IHydratedParentController,
} from '../lifecycle';
import {
  IBindingTargetAccessor,
  IScope,
} from '../observation';
import {
  Scope,
} from '../observation/binding-context';
import {
  ProxyObserver,
} from '../observation/proxy-observer';
import {
  BindableObserver,
} from '../observation/bindable-observer';
import {
  IElementProjector,
  IProjectorLocator,
  CustomElementDefinition,
  CustomElement,
} from '../resources/custom-element';
import {
  CustomAttributeDefinition,
  CustomAttribute,
} from '../resources/custom-attribute';
import {
  BindableDefinition,
} from './bindable';
import {
  IRenderContext,
  getRenderContext,
  RenderContext,
} from './render-context';
import {
  ChildrenObserver,
} from './children';

function callDispose(disposable: IDisposable): void {
  disposable.dispose();
}

type BindingContext<T extends INode, C extends IViewModel<T>> = IIndexable<
  C &
  Required<ICompileHooks<T>> &
  Required<IActivationHooks<IHydratedParentController<T> | null, T>>
>;

const controllerLookup: WeakMap<object, Controller> = new WeakMap();
export class Controller<
  T extends INode = INode,
  C extends IViewModel<T> = IViewModel<T>,
> implements IController<T, C> {
  public readonly id: number = nextId('au$component');

  public head: Controller<T, C> | null = null;
  public tail: Controller<T, C> | null = null;
  public next: Controller<T, C> | null = null;

  public parent: Controller<T> | null = null;
  public bindings: IBinding[] | undefined = void 0;
  public children: Controller<T>[] | undefined = void 0;

  public isActive: boolean = false;
  public hasLockedScope: boolean = false;
  public isReleased: boolean = false;
  public isDisposed: boolean = false;

  public scopeParts: string[] | undefined = void 0;
  public isStrictBinding: boolean = false;

  public scope: Writable<IScope> | undefined = void 0;
  public part: string | undefined = void 0;
  public projector: IElementProjector | undefined = void 0;

  public nodes: INodeSequence<T> | undefined = void 0;
  public context: RenderContext<T> | undefined = void 0;
  public location: IRenderLocation<T> | undefined = void 0;
  public mountStrategy: MountStrategy = MountStrategy.insertBefore;

  private busy: boolean = false;

  public constructor(
    public readonly vmKind: ViewModelKind,
    public flags: LifecycleFlags,
    public readonly lifecycle: ILifecycle,
    public hooks: HooksDefinition,
    /**
     * The viewFactory. Only present for synthetic views.
     */
    public viewFactory: IViewFactory<T> | undefined,
    /**
     * The backing viewModel. This is never a proxy. Only present for custom attributes and elements.
     */
    public viewModel: C | undefined,
    /**
     * The binding context. This may be a proxy. If it is not, then it is the same instance as the viewModel. Only present for custom attributes and elements.
     */
    public bindingContext: BindingContext<T, C> | undefined,
    /**
     * The physical host dom node. Only present for custom elements.
     */
    public host: T | undefined,
  ) {}

  public static getCached<
    T extends INode = INode,
    C extends ICustomElementViewModel<T> = ICustomElementViewModel<T>,
  >(viewModel: C): ICustomElementController<T, C> | undefined {
    return controllerLookup.get(viewModel) as ICustomElementController<T, C> | undefined;
  }

  public static getCachedOrThrow<
    T extends INode = INode,
    C extends ICustomElementViewModel<T> = ICustomElementViewModel<T>,
  >(viewModel: C): ICustomElementController<T, C> {
    const controller = Controller.getCached(viewModel);
    if (controller === void 0) {
      throw new Error(`There is no cached controller for the provided ViewModel: ${String(viewModel)}`);
    }
    return controller as ICustomElementController<T, C>;
  }

  public static forCustomElement<
    T extends INode = INode,
    C extends ICustomElementViewModel<T> = ICustomElementViewModel<T>,
  >(
    viewModel: C,
    lifecycle: ILifecycle,
    host: T,
    parentContainer: IContainer,
    parts: PartialCustomElementDefinitionParts | undefined,
    flags: LifecycleFlags = LifecycleFlags.none,
  ): ICustomElementController<T, C> {
    if (controllerLookup.has(viewModel)) {
      return controllerLookup.get(viewModel) as unknown as ICustomElementController<T, C>;
    }

    const definition = CustomElement.getDefinition(viewModel.constructor as Constructable);
    flags |= definition.strategy;

    const controller = new Controller<T, C>(
      /* vmKind         */ViewModelKind.customElement,
      /* flags          */flags,
      /* lifecycle      */lifecycle,
      /* hooks          */definition.hooks,
      /* viewFactory    */void 0,
      /* viewModel      */viewModel,
      /* bindingContext */getBindingContext<T, C>(flags, viewModel),
      /* host           */host,
    );

    controllerLookup.set(viewModel, controller as Controller);

    controller.hydrateCustomElement(definition, parentContainer, parts);

    return controller as unknown as ICustomElementController<T, C>;
  }

  public static forCustomAttribute<
    T extends INode = INode,
    C extends ICustomAttributeViewModel<T> = ICustomAttributeViewModel<T>,
  >(
    viewModel: C,
    lifecycle: ILifecycle,
    host: T,
    flags: LifecycleFlags = LifecycleFlags.none,
  ): ICustomAttributeController<T, C> {
    if (controllerLookup.has(viewModel)) {
      return controllerLookup.get(viewModel) as unknown as ICustomAttributeController<T, C>;
    }

    const definition = CustomAttribute.getDefinition(viewModel.constructor as Constructable);
    flags |= definition.strategy;

    const controller = new Controller<T, C>(
      /* vmKind         */ViewModelKind.customAttribute,
      /* flags          */flags,
      /* lifecycle      */lifecycle,
      /* hooks          */definition.hooks,
      /* viewFactory    */void 0,
      /* viewModel      */viewModel,
      /* bindingContext */getBindingContext<T, C>(flags, viewModel),
      /* host           */host
    );

    controllerLookup.set(viewModel, controller as Controller);

    controller.hydrateCustomAttribute(definition);

    return controller as unknown as ICustomAttributeController<T, C>;
  }

  public static forSyntheticView<
    T extends INode = INode,
  >(
    viewFactory: IViewFactory<T>,
    lifecycle: ILifecycle,
    context: IRenderContext<T>,
    flags: LifecycleFlags = LifecycleFlags.none,
  ): ISyntheticView<T> {
    const controller = new Controller<T>(
      /* vmKind         */ViewModelKind.synthetic,
      /* flags          */flags,
      /* lifecycle      */lifecycle,
      /* hooks          */HooksDefinition.none,
      /* viewFactory    */viewFactory,
      /* viewModel      */void 0,
      /* bindingContext */void 0,
      /* host           */void 0,
    );

    controller.hydrateSynthetic(context, viewFactory.parts);

    return controller as unknown as ISyntheticView<T>;
  }

  private hydrateCustomElement(
    definition: CustomElementDefinition,
    parentContainer: IContainer,
    parts: PartialCustomElementDefinitionParts | undefined,
  ): void {
    const flags = this.flags |= definition.strategy;
    const instance = this.viewModel as BindingContext<T, C>;
    createObservers(this.lifecycle, definition, flags, instance);
    createChildrenObservers(this as Controller, definition, flags, instance);

    this.scope = Scope.create(flags, this.bindingContext!, null);

    const hooks = this.hooks;
    if (hooks.hasCreate) {
      const result = instance.create(
        /* controller      */this as unknown as IDryCustomElementController<T, typeof instance>,
        /* parentContainer */parentContainer,
        /* definition      */definition,
        /* parts           */parts,
      );
      if (result !== void 0 && result !== definition) {
        definition = CustomElementDefinition.getOrCreate(result);
      }
    }

    const context = this.context = getRenderContext<T>(definition, parentContainer, parts) as RenderContext<T>;
    // Support Recursive Components by adding self to own context
    definition.register(context);
    if (definition.injectable !== null) {
      // If the element is registered as injectable, support injecting the instance into children
      context.beginChildComponentOperation(instance);
    }

    if (hooks.hasBeforeCompile) {
      instance.beforeCompile(this as unknown as IContextualCustomElementController<T, typeof instance>);
    }

    const compiledContext = context.compile();
    const compiledDefinition = compiledContext.compiledDefinition;

    this.scopeParts = compiledDefinition.scopeParts;
    this.isStrictBinding = compiledDefinition.isStrictBinding;

    const projectorLocator = parentContainer.get(IProjectorLocator);

    this.projector = projectorLocator.getElementProjector(
      context.dom,
      this as unknown as ICustomElementController<T, typeof instance>,
      this.host!,
      compiledDefinition,
    );

    (instance as Writable<C>).$controller = this;
    const nodes = this.nodes = compiledContext.createNodes();

    if (hooks.hasAfterCompile) {
      instance.afterCompile(this as unknown as ICompiledCustomElementController<T, typeof instance>);
    }

    const targets = nodes.findTargets();
    compiledContext.render(
      /* flags      */this.flags,
      /* controller */this,
      /* targets    */targets,
      /* definition */compiledDefinition,
      /* host       */this.host,
      /* parts      */parts,
    );

    if (hooks.hasAfterCompileChildren) {
      instance.afterCompileChildren(this as unknown as ICustomElementController<T, typeof instance>);
    }
  }

  private hydrateCustomAttribute(definition: CustomAttributeDefinition): void {
    const flags = this.flags | definition.strategy;
    const instance = this.viewModel!;
    createObservers(this.lifecycle, definition, flags, instance);

    (instance as Writable<C>).$controller = this;
  }

  private hydrateSynthetic(
    context: IRenderContext<T>,
    parts: PartialCustomElementDefinitionParts | undefined,
  ): void {
    this.context = context as RenderContext<T>;
    const compiledContext = context.compile();
    const compiledDefinition = compiledContext.compiledDefinition;

    this.scopeParts = compiledDefinition.scopeParts;
    this.isStrictBinding = compiledDefinition.isStrictBinding;

    const nodes = this.nodes = compiledContext.createNodes();
    const targets = nodes.findTargets();
    compiledContext.render(
      /* flags      */this.flags,
      /* controller */this,
      /* targets    */targets,
      /* definition */compiledDefinition,
      /* host       */void 0,
      /* parts      */parts,
    );
  }

  public activate(
    initiator: Controller<T>,
    parent: Controller<T> | null,
    flags: LifecycleFlags,
    scope?: Writable<IScope>,
    part?: string,
  ): void | Promise<void> {
    if (this.isActive || !(parent === null || parent.isActive)) {
      return;
    }
    if (this.busy) {
      throw new Error(`Trying to activate while controller is still busy deactivating. Cancellation is still TODO`);
    }
    this.busy = true;
    this.isActive = true;

    this.parent = parent;
    this.part = part;
    flags |= LifecycleFlags.fromBind;

    switch (this.vmKind) {
      case ViewModelKind.customElement:
        // Custom element scope is created and assigned during hydration
        this.scope!.parentScope = scope === void 0 ? null : scope;
        this.scope!.scopeParts = this.scopeParts!;
        break;
      case ViewModelKind.customAttribute:
        this.scope = scope;
        break;
      case ViewModelKind.synthetic:
        if (scope === void 0 || scope === null) {
          throw new Error(`Scope is null or undefined`);
        }

        scope.scopeParts = mergeDistinct(scope.scopeParts, this.scopeParts, false);

        this.isReleased = false;
        if (!this.hasLockedScope) {
          this.scope = scope;
        }
        break;
    }

    if (this.hooks.hasBeforeBind) {
      const ret = this.bindingContext!.beforeBind(initiator as IHydratedController<T>, parent as IHydratedParentController<T>, flags);
      if (ret instanceof Promise) {
        return ret.then(() => {
          return this.bind(initiator, parent, flags);
        });
      }
    }

    return this.bind(initiator, parent, flags);
  }

  private bind(
    initiator: Controller<T>,
    parent: Controller<T> | null,
    flags: LifecycleFlags,
  ): void | Promise<void> {
    if (this.bindings !== void 0) {
      if (this.isStrictBinding) {
        flags |= LifecycleFlags.isStrictBindingStrategy;
      }
      const { scope, part, bindings } = this;
      for (let i = 0, ii = bindings.length; i < ii; ++i) {
        bindings[i].$bind(flags, scope!, part);
      }
    }

    if (this.hooks.hasAfterBind) {
      const ret = this.bindingContext!.afterBind(initiator as IHydratedController<T>, parent as IHydratedParentController<T>, flags);
      if (ret instanceof Promise) {
        return ret.then(() => {
          return this.attach(initiator, parent, flags);
        });
      }
    }

    return this.attach(initiator, parent, flags);
  }

  private attach(
    initiator: Controller<T>,
    parent: Controller<T> | null,
    flags: LifecycleFlags,
  ): void | Promise<void> {
    flags |= LifecycleFlags.fromAttach;

    switch (this.vmKind) {
      case ViewModelKind.customElement:
        this.projector!.project(this.nodes!);
        break;
      case ViewModelKind.synthetic:
        switch (this.mountStrategy) {
          case MountStrategy.append:
            this.nodes!.appendTo(this.location! as T);
            break;
          case MountStrategy.insertBefore:
            this.nodes!.insertBefore(this.location!);
            break;
        }
        break;
    }

    if (this.hooks.hasAfterAttach) {
      const ret = this.bindingContext!.afterAttach(initiator as IHydratedController<T>, parent as IHydratedParentController<T>, flags);
      if (ret instanceof Promise) {
        return ret.then(() => {
          return this.activateChildren(initiator, flags);
        });
      }
    }

    return this.activateChildren(initiator, flags);
  }

  private activateChildren(
    initiator: Controller<T>,
    flags: LifecycleFlags,
  ): void | Promise<void> {
    let promises: Promise<void>[] | undefined = void 0;
    let ret: void | Promise<void>;

    if (this.children !== void 0) {
      const { children, scope, part } = this;
      for (let i = 0, ii = children.length; i < ii; ++i) {
        ret = children[i].activate(initiator, this as Controller<T>, flags, scope, part);
        if (ret instanceof Promise) {
          (promises ?? (promises = [])).push(ret);
        }
      }
    }

    if (promises !== void 0) {
      return Promise.all(promises).then(() => {
        return this.endActivate(initiator, flags);
      });
    }

    return this.endActivate(initiator, flags);
  }

  private endActivate(
    initiator: Controller<T>,
    flags: LifecycleFlags,
  ): void | Promise<void> {
    let promises: Promise<void>[] | undefined = void 0;
    let ret: void | Promise<void>;

    if (initiator.head === null) {
      initiator.head = this as Controller<T>;
    } else {
      initiator.tail!.next = this as Controller<T>;
    }
    initiator.tail = this as Controller<T>;

    if (initiator === this && initiator.head !== null) {
      let cur = initiator.head;
      initiator.head = initiator.tail = null;
      let next: Controller<T> | null;
      do {
        if (cur.hooks.hasAfterAttachChildren) {
          ret = cur.bindingContext!.afterAttachChildren(initiator as IHydratedController<T>, flags);
          if (ret instanceof Promise) {
            const $cur = cur;
            (promises ?? (promises = [])).push(ret.then(() => {
              $cur.busy = false;
            }));
          } else {
            cur.busy = false;
          }
        } else {
          cur.busy = false;
        }
        next = cur.next;
        cur.next = null;
        cur = next!;
      } while (cur !== null);

      if (promises !== void 0) {
        return Promise.all(promises).then(PLATFORM.noop);
      }
    }
  }

  public deactivate(
    initiator: Controller<T>,
    parent: Controller<T> | null,
    flags: LifecycleFlags,
  ): void | Promise<void> {
    if (!this.isActive) {
      return;
    }
    if (this.busy) {
      throw new Error(`Trying to deactivate while controller is still busy activating. Cancellation is still TODO`);
    }
    this.busy = true;
    this.isActive = false;

    flags |= LifecycleFlags.fromDetach;

    if (this.hooks.hasBeforeDetach) {
      const ret = this.bindingContext!.beforeDetach(initiator as IHydratedController<T>, parent as IHydratedParentController<T>, flags);
      if (ret instanceof Promise) {
        return ret.then(() => {
          return this.detach(initiator, parent, flags);
        });
      }
    }

    return this.detach(initiator, parent, flags);
  }

  private detach(
    initiator: Controller<T>,
    parent: Controller<T> | null,
    flags: LifecycleFlags,
  ): void | Promise<void> {
    switch (this.vmKind) {
      case ViewModelKind.customElement:
        this.projector!.take(this.nodes!);
        break;
      case ViewModelKind.synthetic:
        this.nodes!.remove();
        this.nodes!.unlink();
        break;
    }

    if (this.hooks.hasBeforeUnbind) {
      const ret = this.bindingContext!.beforeUnbind(initiator as IHydratedController<T>, parent as IHydratedParentController<T>, flags);
      if (ret instanceof Promise) {
        return ret.then(() => {
          return this.unbind(initiator, parent, flags);
        });
      }
    }

    return this.unbind(initiator, parent, flags);
  }

  private unbind(
    initiator: Controller<T>,
    parent: Controller<T> | null,
    flags: LifecycleFlags,
  ): void | Promise<void> {
    flags |= LifecycleFlags.fromUnbind;

    if (this.bindings !== void 0) {
      const { bindings } = this;
      for (let i = 0, ii = bindings.length; i < ii; ++i) {
        bindings[i].$unbind(flags);
      }
    }

    switch (this.vmKind) {
      case ViewModelKind.customElement:
        this.scope!.parentScope = null;
        break;
    }

    if (this.hooks.hasAfterUnbind) {
      const ret = this.bindingContext!.afterUnbind(initiator as IHydratedController<T>, parent as IHydratedParentController<T>, flags);
      if (ret instanceof Promise) {
        return ret.then(() => {
          return this.deactivateChildren(initiator, flags);
        });
      }
    }

    return this.deactivateChildren(initiator, flags);
  }

  private deactivateChildren(
    initiator: Controller<T>,
    flags: LifecycleFlags,
  ): void | Promise<void> {
    let promises: Promise<void>[] | undefined = void 0;
    let ret: void | Promise<void>;

    if (this.children !== void 0) {
      const { children } = this;
      for (let i = 0, ii = children.length; i < ii; ++i) {
        ret = children[i].deactivate(initiator, this as Controller<T>, flags);
        if (ret instanceof Promise) {
          (promises ?? (promises = [])).push(ret);
        }
      }
    }

    if (promises !== void 0) {
      return Promise.all(promises).then(() => {
        return this.endDeactivate(initiator, flags);
      });
    }

    return this.endDeactivate(initiator, flags);
  }

  private endDeactivate(
    initiator: Controller<T>,
    flags: LifecycleFlags,
  ): void | Promise<void> {
    let promises: Promise<void>[] | undefined = void 0;
    let ret: void | Promise<void>;

    if (initiator.head === null) {
      initiator.head = this as Controller<T>;
    } else {
      initiator.tail!.next = this as Controller<T>;
    }
    initiator.tail = this as Controller<T>;

    if (initiator === this && initiator.head !== null) {
      let cur = initiator.head;
      initiator.head = initiator.tail = null;
      let next: Controller<T> | null;
      do {
        if (cur.hooks.hasAfterUnbindChildren) {
          ret = cur.bindingContext!.afterUnbindChildren(initiator as IHydratedController<T>, flags);
          if (ret instanceof Promise) {
            (promises ?? (promises = [])).push(ret.then(() => {
              cur.postEndDeactivate();
            }));
          } else {
            cur.postEndDeactivate();
          }
        } else {
          cur.postEndDeactivate();
        }
        next = cur.next;
        cur.next = null;
        cur = next!;
      } while (cur !== null);

      if (promises !== void 0) {
        return Promise.all(promises).then(PLATFORM.noop);
      }
    }
  }

  private postEndDeactivate(): void {
    this.parent = null;

    switch (this.vmKind) {
      case ViewModelKind.customAttribute:
        this.scope = void 0;
        break;
      case ViewModelKind.synthetic:
        if (!this.hasLockedScope) {
          this.scope = void 0;
        }

        if (
          this.isReleased &&
          !this.viewFactory!.tryReturnToCache(this as ISyntheticView<T>)
        ) {
          this.dispose();
        }
        break;
    }

    this.busy = false;
  }

  public addBinding(binding: IBinding): void {
    if (this.bindings === void 0) {
      this.bindings = [binding];
    } else {
      this.bindings[this.bindings.length] = binding;
    }
  }

  public addController(controller: Controller<T>): void {
    if (this.children === void 0) {
      this.children = [controller];
    } else {
      this.children[this.children.length] = controller;
    }
  }

  public is(name: string): boolean {
    switch (this.vmKind) {
      case ViewModelKind.customAttribute: {
        const def = CustomAttribute.getDefinition(this.viewModel!.constructor as Constructable);
        return def.name === name;
      }
      case ViewModelKind.customElement: {
        const def = CustomElement.getDefinition(this.viewModel!.constructor as Constructable);
        return def.name === name;
      }
      case ViewModelKind.synthetic:
        return this.viewFactory!.name === name;
    }
  }

  public lockScope(scope: Writable<IScope>): void {
    this.scope = scope;
    this.hasLockedScope = true;
  }

  public setLocation(location: IRenderLocation<T>, mountStrategy: MountStrategy): void {
    this.location = location;
    this.mountStrategy = mountStrategy;
  }

  public release(): void {
    this.isReleased = true;
  }

  public dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.isDisposed = true;

    if (this.hooks.hasDispose) {
      this.bindingContext!.dispose();
    }

    if (this.children !== void 0) {
      this.children.forEach(callDispose);
      this.children = void 0;
    }

    if (this.bindings !== void 0) {
      this.bindings.forEach(callDispose);
      this.bindings = void 0;
    }

    this.scope = void 0;
    this.projector = void 0;

    this.nodes = void 0;
    this.context = void 0;
    this.location = void 0;

    this.viewFactory = void 0;
    if (this.viewModel !== void 0) {
      controllerLookup.delete(this.viewModel);
      this.viewModel = void 0;
    }
    this.bindingContext = void 0;
    this.host = void 0;
  }

  public getTargetAccessor(propertyName: string): IBindingTargetAccessor | undefined {
    const { bindings } = this;
    if (bindings !== void 0) {
      const binding = bindings.find(b => (b as PropertyBinding).targetProperty === propertyName) as PropertyBinding;
      if (binding !== void 0) {
        return binding.targetObserver;
      }
    }
    return void 0;
  }
}

function getBindingContext<T extends INode, C extends IViewModel<T>>(flags: LifecycleFlags, instance: object): BindingContext<T, C> {
  if ((instance as IIndexable).noProxy === true || (flags & LifecycleFlags.proxyStrategy) === 0) {
    return instance as BindingContext<T, C>;
  }

  return ProxyObserver.getOrCreate(instance).proxy as unknown as BindingContext<T, C>;
}

function getLookup(instance: IIndexable): Record<string, BindableObserver | ChildrenObserver> {
  let lookup = instance.$observers;
  if (lookup === void 0) {
    Reflect.defineProperty(
      instance,
      '$observers',
      {
        enumerable: false,
        value: lookup = {},
      },
    );
  }
  return lookup as Record<string, BindableObserver | ChildrenObserver>;
}

function createObservers(
  lifecycle: ILifecycle,
  definition: CustomElementDefinition | CustomAttributeDefinition,
  flags: LifecycleFlags,
  instance: object,
): void {
  const bindables = definition.bindables;
  const observableNames = Object.getOwnPropertyNames(bindables);
  const length = observableNames.length;
  if (length > 0) {
    let name: string;
    let bindable: BindableDefinition;

    if ((flags & LifecycleFlags.proxyStrategy) > 0) {
      for (let i = 0; i < length; ++i) {
        name = observableNames[i];
        bindable = bindables[name];

        new BindableObserver(
          lifecycle,
          flags,
          ProxyObserver.getOrCreate(instance).proxy,
          name,
          bindable.callback,
          bindable.set,
        );
      }
    } else {
      const observers = getLookup(instance as IIndexable);

      for (let i = 0; i < length; ++i) {
        name = observableNames[i];

        if (observers[name] === void 0) {
          bindable = bindables[name];

          observers[name] = new BindableObserver(
            lifecycle,
            flags,
            instance as IIndexable,
            name,
            bindable.callback,
            bindable.set,
          );
        }
      }
    }
  }
}

function createChildrenObservers(
  controller: Controller,
  definition: CustomElementDefinition,
  flags: LifecycleFlags,
  instance: object,
): void {
  const childrenObservers = definition.childrenObservers;
  const childObserverNames = Object.getOwnPropertyNames(childrenObservers);
  const length = childObserverNames.length;
  if (length > 0) {
    const observers = getLookup(instance as IIndexable);

    let name: string;
    for (let i = 0; i < length; ++i) {
      name = childObserverNames[i];

      if (observers[name] == void 0) {
        const childrenDescription = childrenObservers[name];
        observers[name] = new ChildrenObserver(
          controller as ICustomElementController,
          instance as IIndexable,
          flags,
          name,
          childrenDescription.callback,
          childrenDescription.query,
          childrenDescription.filter,
          childrenDescription.map,
          childrenDescription.options,
        );
      }
    }
  }
}
