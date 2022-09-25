import { astBind, astEvaluate, astUnbind, connectable } from '@aurelia/runtime';
import { astEvaluator } from './binding-utils';

import type { ITask } from '@aurelia/platform';
import type { IIndexable, IServiceLocator } from '@aurelia/kernel';
import type {
  IObservable,
  IObserverLocator,
  IsExpression,
  Scope,
} from '@aurelia/runtime';
import type { IAstBasedBinding } from './interfaces-bindings';
export interface LetBinding extends IAstBasedBinding {}

export class LetBinding implements IAstBasedBinding {
  public interceptor: this = this;

  public isBound: boolean = false;
  public $scope?: Scope = void 0;
  public task: ITask | null = null;

  public target: (IObservable & IIndexable) | null = null;
  /** @internal */
  private readonly _toBindingContext: boolean;

  /**
   * A semi-private property used by connectable mixin
   *
   * @internal
   */
  public readonly oL: IObserverLocator;

  // see Listener binding for explanation
  /** @internal */
  public readonly boundFn = false;

  public constructor(
    public locator: IServiceLocator,
    observerLocator: IObserverLocator,
    public ast: IsExpression,
    public targetProperty: string,
    toBindingContext: boolean = false,
  ) {
    this.oL = observerLocator;
    this._toBindingContext = toBindingContext;
  }

  public handleChange(): void {
    if (!this.isBound) {
      return;
    }

    const target = this.target as IIndexable;
    const targetProperty = this.targetProperty;
    const previousValue: unknown = target[targetProperty];
    this.obs.version++;
    const newValue = astEvaluate(this.ast, this.$scope!, this, this.interceptor);
    this.obs.clear();
    if (newValue !== previousValue) {
      target[targetProperty] = newValue;
    }
  }

  public handleCollectionChange(): void {
    this.handleChange();
  }

  public $bind(scope: Scope): void {
    if (this.isBound) {
      if (this.$scope === scope) {
        return;
      }
      this.interceptor.$unbind();
    }

    this.$scope = scope;
    this.target = (this._toBindingContext ? scope.bindingContext : scope.overrideContext) as IIndexable;

    astBind(this.ast, scope, this.interceptor);

    this.target[this.targetProperty]
      = astEvaluate(this.ast, scope, this, this.interceptor);

    // add isBound flag and remove isBinding flag
    this.isBound = true;
  }

  public $unbind(): void {
    if (!this.isBound) {
      return;
    }

    astUnbind(this.ast, this.$scope!, this.interceptor);

    this.$scope = void 0;
    this.obs.clearAll();

    // remove isBound and isUnbinding flags
    this.isBound = false;
  }
}

connectable(LetBinding);
astEvaluator(true)(LetBinding);
