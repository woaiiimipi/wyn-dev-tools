export const template = {
  action: (lowerName: string, upperName: string) =>
`import { CheckFieldType, ActionMenuType } from 'Enums';
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
  containerts: (upperName: string) => 
`import React, { Component } from 'react';
import { connect } from 'react-redux';

interface ${upperName}ContainerProps {
  scenario: any;
}
interface ${upperName}ContainerState {
}
const mapStateToProps = (state, { scenario }) => {
  // const actualScenario = fromState.scenarioOrInnerPivotTableById(scenario.id, state); // warning: make sure subscribe event update on scenario, does it nessary?
  // return {
  //   scenario: actualScenario,
  // };
};
@(connect(mapStateToProps) as ClassDecorator)
export class ${upperName}Container extends Component<${upperName}ContainerProps, ${upperName}ContainerState>{
  constructor(props) {
    super(props);
  }
  state: ${upperName}ContainerState = {
  };

  public render() {
    return (
      <div className="dd-${upperName.replace(/\B([A-Z])/g, '-$1').toLowerCase()}-container dd-action-bar-dialog">
        dialog content
      </div>
    );
  }
}
`,
  containerscss: (upperName: string) =>
`.dd-${upperName.replace(/\B([A-Z])/g, '-$1').toLowerCase()}-container {
  
}
`,
  containerindex: (upperName: string, lowerName: string) =>
`import { showDraggableDialog } from 'CommonComponents';

import { ${upperName}Container } from './${upperName}Container';

export const show${upperName}Dialog = showDraggableDialog(${upperName}Container, 'dialogs.${lowerName}.title', '${upperName.replace(/\B([A-Z])/g, '-$1').toLowerCase()}');
`,
  extensionCommonAction: (upperName: string, lowerName: string) => `export const ${lowerName} = {
    type: ActionDefNS.ActionType.Extension,
    name: '${lowerName}',
    path: '${lowerName}',
    extensionType: ActionDefNS.ExtensionType.${upperName},
    displayNameKey: 'actionBar.${lowerName}',
    iconCss: 'icon-${lowerName.replace(/\B([A-Z])/g, '-$1').toLowerCase()}',
  };
  `,
  zhToTw: (text: string) => `
  <textarea id="text" value=${text}></textarea>
  <button id="convert">Convert</button>
  <button>Copy</button>
  <script>
    const text = window.clipboardData.getData('Text');
    const convert = document.getElementById("convert");
    convert.onclick = () => {
      convert.value
    }
    document.getElementById('text');
  <script>
  `
};
