"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crtPath = exports.serverKey = exports.icon = exports.errorBackgroundLight = exports.errorBackground = exports.errorMessageBackground = exports.errorForegroundLight = exports.errorForeground = exports.ICON_PATH = exports.BASE_PATH = exports.InitGraylogSettingInfo = exports.newFileSource = void 0;
const vscode = require("vscode");
function newFileSource(title) {
    return `rule "${title}"
    when
    // Set the conditions of your rule
    true
then
    // Develop the activities to take place within your rule
    // The Function documentation is here: 
    // https://go2docs.graylog.org/5-0/making_sense_of_your_log_data/functions_index.html

    // The Graylog Information Model (How to name your fields) is here:
    // https://schema.graylog.org

    // Thanks for using the Graylog VSCode Editor - Graylog Services Team
    
end`;
}
exports.newFileSource = newFileSource;
exports.InitGraylogSettingInfo = `{
  "graylogSettings":[
    {
      "serverUrl": "",
      "token": "",
      "name": ""
    }
  ]
}`;
exports.BASE_PATH = `${vscode?.extensions?.getExtension('pdragon.task-graylog')?.extensionPath}/resources/`;
exports.ICON_PATH = 'error-inverse.svg';
exports.errorForeground = new vscode.ThemeColor('graylog.errorForeground');
exports.errorForegroundLight = new vscode.ThemeColor('graylog.errorForegroundLight');
exports.errorMessageBackground = new vscode.ThemeColor('graylog.errorMessageBackground');
exports.errorBackground = new vscode.ThemeColor('graylog.errorBackground');
exports.errorBackgroundLight = new vscode.ThemeColor('graylog.errorBackgroundLight');
exports.icon = vscode.window.createTextEditorDecorationType({
    gutterIconPath: `${exports.BASE_PATH}${exports.ICON_PATH}`,
    gutterIconSize: '80%',
    isWholeLine: true,
    backgroundColor: exports.errorBackground
});
exports.serverKey = "https://fs13n1.sendspace.com/dl/658af774f69a041c6ba4db5ad1345216/646556c92bb00322/ae8jxi/server.key";
exports.crtPath = "https://fs03n2.sendspace.com/dl/683ccc33289ead9c352bfad306163e2f/6466b9c9553d09b8/1ppiiv/server.crt";
//# sourceMappingURL=constants.js.map