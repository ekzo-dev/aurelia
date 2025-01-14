import { IBinding, INodeObserverLocator, IObserverLocator, type BindingBehaviorInstance, type Scope } from '@aurelia/runtime';
import { BindingMode } from '../../binding/interfaces-bindings';
import { NodeObserverLocator } from '../../observation/observer-locator';
import { bindingBehavior } from '../binding-behavior';

import { PropertyBinding } from '../../binding/property-binding';
import { resolve } from '@aurelia/kernel';
import { ErrorNames, createMappedError } from '../../errors';

export class UpdateTriggerBindingBehavior implements BindingBehaviorInstance {
  /** @internal */ private readonly _observerLocator = resolve(IObserverLocator);
  /** @internal */ private readonly _nodeObserverLocator = resolve(INodeObserverLocator) as NodeObserverLocator;

  public bind(_scope: Scope, binding: IBinding, ...events: string[]): void {
    if (!(this._nodeObserverLocator instanceof NodeObserverLocator)) {
      throw createMappedError(ErrorNames.update_trigger_behavior_not_supported);
    }
    if (events.length === 0) {
      throw createMappedError(ErrorNames.update_trigger_behavior_no_triggers);
    }

    if (!(binding instanceof PropertyBinding) || !(binding.mode & BindingMode.fromView)) {
      throw createMappedError(ErrorNames.update_trigger_invalid_usage);
    }

    // ensure the binding's target observer has been set.
    const targetConfig = this._nodeObserverLocator.getNodeObserverConfig(
      binding.target as HTMLElement,
      binding.targetProperty,
    );
    // todo(bigopon): potentially updateTrigger can be used to teach Aurelia adhoc listening capability
    //                since event names are the only thing needed
    if (targetConfig == null) {
      throw createMappedError(ErrorNames.update_trigger_behavior_node_property_not_observable, binding);
    }
    const targetObserver = this._nodeObserverLocator.getNodeObserver(
      binding.target as HTMLElement,
      binding.targetProperty,
      this._observerLocator,
    )!; // the check on targetConfig ensures it's not null, save execessive check her

    targetObserver.useConfig({ readonly: targetConfig.readonly, default: targetConfig.default, events });

    binding.useTargetObserver(targetObserver);
  }
}

bindingBehavior('updateTrigger')(UpdateTriggerBindingBehavior);
