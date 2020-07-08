"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.template = {
    action: (lowerName, upperName) => `
import { CheckFieldType, ActionMenuType } from 'Enums';
import Property from '../../common/Property';
import { ActionDefNS } from '../../../interfaces';
import { checkCondition } from '../utils/actionStatusUtils';
import ActionBase from '../ActionBase';

interface I${upperName}CareStatus {
  [CheckFieldType.Editing]: boolean;
}
const show${upperName}Conditions: I${upperName}CareStatus[] = [
  {
    [CheckFieldType.Editing]: false,
  },
];

export default class ${upperName}Action extends ActionBase {
  constructor(def: ActionDefNS.IAction) {
    super();
    this.name = def.type;
    this.iconCss = 'icon-${lowerName.replace(/\B([A-Z])/g, '-$1').toLowerCase()}';
    this.displayNameKey = 'actionBar.${lowerName}';
  }

  public getVisibility(scenario: RuntimeNS.IScenario, env: RuntimeNS.IEnvironment, status: RuntimeNS.ICheckFieldTypeMap): boolean {
    return super.getVisibility(scenario, env) && checkCondition(
      show${upperName}Conditions,
      status,
    );
  }

  public getDescriptor(scenario?: RuntimeNS.IScenario, parent?: ComplexNS.IDashboardOptions,  env?: RuntimeNS.IEnvironment): DescriptorNS.IDescriptor {
    const descriptor = super.getDescriptor(scenario, parent, env);
    return {
      ...descriptor,
      type: ActionMenuType.${upperName},
    };
  }
}
`,
};
//# sourceMappingURL=template.js.map