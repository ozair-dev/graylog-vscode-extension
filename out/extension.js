'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const graylog_1 = require("./graylog");
const fileSystemProvider_1 = require("./fileSystemProvider");
const utils_1 = require("./utils");
const colorData = require('../themes/color');
function activate(context) {
    (0, utils_1.addColorSettings)(colorData);
    const graylog = new fileSystemProvider_1.GraylogFileSystemProvider();
    const connectpart = new graylog_1.ConnectionPart(graylog, context.secrets);
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider('graylog', graylog, { isCaseSensitive: true }));
    const treeview = vscode.window.createTreeView('graylog', { treeDataProvider: graylog });
    context.subscriptions.push(vscode.commands.registerCommand('graylog.RereshWorkSpace', async () => {
        connectpart.refreshWorkspace();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('graylog.showCreateInputBox', async () => {
        console.log('---------------');
    }));
    context.subscriptions.push(vscode.commands.registerCommand('graylog.treeItemClick', (item) => {
        graylog.onClickItem(item);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('graylog.settingApiInfo', async () => {
        await connectpart.initSettings();
        connectpart.openSettings();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('graylog.saveToLocal', (item) => {
        connectpart.saveToLocalFolder(item);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('graylog.createNewRule', async (item) => {
        const value = await vscode.window.showInputBox({ prompt: 'Enter a value' });
        if (value) {
            connectpart.createNewRule(item, value);
        }
        // connectpart.createNewRule(item);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('graylog.selectInstances', async () => {
        await connectpart.initSettings();
        const items = [];
        if (connectpart.apis.apiInfoList && connectpart.apis.apiInfoList.length > 0) {
            for (let i = 0; i < connectpart.apis.apiInfoList.length; i++) {
                items.push({
                    label: connectpart.apis.apiInfoList[i]['apiHostUrl'],
                    index: i
                });
            }
            const result = await vscode.window.showQuickPick(items, {
                canPickMany: true,
                placeHolder: 'Select Servers',
            });
            if (result) {
                connectpart.clearworkspace(result);
            }
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('graylog.MultiSelect', () => {
        graylog.updateTreeViewMode();
    }));
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarItem.show();
    // statusBarItem.color = new vscode.ThemeColor('statusBarItem.errorBackground');
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    context.subscriptions.push(vscode.commands.registerCommand('graylog.setStatusBar', (text) => {
        statusBarItem.text = text;
    }));
    context.subscriptions.push(vscode.commands.registerCommand('graylog.exportToContext', async () => {
        ///action for export to content pack
        await connectpart.createContentPack();
        vscode.commands.executeCommand("graylog.MultiSelect");
    }));
    vscode.workspace.onDidChangeTextDocument((e) => {
        checkStatusBarShowing(e?.document.uri.scheme, statusBarItem);
        connectpart.onDidChange(e?.document);
    });
    vscode.window.onDidChangeActiveTextEditor(e => {
        checkStatusBarShowing(e?.document.uri.scheme, statusBarItem);
        if (e?.document) {
            connectpart.onDidChange(e?.document);
        }
    });
    vscode.workspace.onDidCreateFiles((e) => {
        e.files.map((file) => {
            let name = file.path.replace("/", "").split('.')[0];
            let extension = file.path.replace("/", "").split('.')[1];
            if (file.scheme === 'graylog' && extension === 'grule') {
                connectpart.createRule(name);
            }
        });
    });
}
exports.activate = activate;
function checkStatusBarShowing(scheme, item) {
    if (!scheme) {
        return;
    }
    if (scheme === 'graylog') {
        item.show();
    }
    else {
        item.hide();
    }
}
//# sourceMappingURL=extension.js.map