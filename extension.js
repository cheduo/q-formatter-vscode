'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const stream = require('stream');
const os = require("os");
var channel = null;
const fullRange = doc => doc.validateRange(new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE));
const MODE = { language: 'q' };

class QFormatter {
    constructor() {
        this.machine_os = os.platform();
        console.log(this.machine_os);
        this.py = vscode.workspace.getConfiguration('q-formatter')['pythonPath'];
        if (this.py == '' && this.machine_os == 'win32') {
            this.py = 'python ';
        }
        this.formatter = vscode.workspace.getConfiguration('q-formatter')['formatterPath'];
        if (this.formatter == '') {
            this.formatter = '"' + __dirname + '/formatter/q_formatter.py"';
        }
    }

    formatDocument(document, range) {
        return new Promise((resolve, reject) => {
            this.format(document, range).then((res) => {
                return resolve(res);
            });
        });
    }

    format(document, range) {
        return new Promise((resolve, reject) => {
            // let formatter = this.py +'"'+ __dirname + '/formatter/q_formatter.py"';
            let indentwidth = " --indentWidth=" + vscode.workspace.getConfiguration('q-formatter')['indentwidth'];
            let separateBlocks = " --separateBlocks=" + vscode.workspace.getConfiguration('q-formatter')['separateBlocks'];
            let filename = ' -';
            let start = " --startLine=" + (range.start.line + 1);
            let end = " --endLine=" + (range.end.line + 1);
            var p = cp.exec(this.py + this.formatter + filename + indentwidth + separateBlocks + start + end, (err, stdout, stderr) => {
                if (stdout != '') {
                    let toreplace = document.validateRange(new vscode.Range(range.start.line, 0, range.end.line + 1, 0));
                    var edit = [vscode.TextEdit.replace(toreplace, stdout)];
                    if (stderr != '') {
                        vscode.window.showWarningMessage('formatting warning\n' + stderr);
                    }
                    return resolve(edit);
                }
                vscode.window.showErrorMessage('formatting failed\n' + stderr);
                return resolve(null);
            });
            var stdinStream = new stream.Readable();
            stdinStream.push(document.getText());
            stdinStream.push(null);
            stdinStream.pipe(p.stdin);
        });
    }
}

exports.QFormatter = QFormatter;

class QDocumentRangeFormatter {
    constructor() {
        this.formatter = new QFormatter();
    }
    provideDocumentFormattingEdits(document, options, token) {
        return this.formatter.formatDocument(document, fullRange(document));
    }
    provideDocumentRangeFormattingEdits(document, range, options, token) {
        return this.formatter.formatDocument(document, range);
    }
}

function activate(context) {
    channel = vscode.window.createOutputChannel('q-formatter');
    const formatter = new QDocumentRangeFormatter();
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(MODE, formatter));
    context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider(MODE, formatter));
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map
