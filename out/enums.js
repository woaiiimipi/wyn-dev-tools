"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scenarioMap = {
    pivotCharts: (picked) => [
        'area',
        'bar',
        'barInPolar',
        'bubble',
        'column',
        'combined',
        'dataTable',
        'donut',
        'filledRadar',
        'floorPlan',
        'funnel',
        'gauge',
        'indicator',
        'KPI',
        'kpiMatrix',
        'line',
        'map',
        'percentStackedArea',
        'percentStackedBar',
        'percentStackedColumn',
        'pie',
        'pivotTable',
        'radar',
        'radialStackedBar',
        'rangeArea',
        'rangeBar',
        'rangeColumn',
        'rose',
        'scatter',
        'stackedArea',
        'stackedBar',
        'stackedBarInPolar',
        'stackedColumn',
        'sunburst',
        'treeMap',
    ].map(i => ({ label: i, picked })),
    richEditor: (picked) => [
        'richEditor',
    ].map(i => ({ label: i, picked })),
    picture: (picked) => [
        'picture',
    ].map(i => ({ label: i, picked })),
    slicer: (picked) => [
        'label',
        'tree',
        'comboBox',
        'dateRange',
        'dataRange',
        'relativeDate',
    ].map(i => ({ label: i, picked })),
    container: (picked) => [
        'container',
    ].map(i => ({ label: i, picked })),
    tabContainer: (picked) => [
        'tabContainer',
    ].map(i => ({ label: i, picked })),
    webContent: (picked) => [
        'webContent',
    ].map(i => ({ label: i, picked })),
    spreadChart: (picked) => [
        'spreadChart',
    ].map(i => ({ label: i, picked })),
};
//# sourceMappingURL=enums.js.map