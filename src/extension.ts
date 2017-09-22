'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('beyang.printf', printf));
}

/**
 * Injects a printf debugging statement
 */
async function printf() {
    const ed = vscode.window.activeTextEditor;
    if (!ed) {
        return;
    }

    const sentinel = nearestPreviousNonEmptyLine(ed, ed.selection.active.line - 1);

    const { line, startBuffer, endBuffer } = commentLineAndSelection(ed.document.languageId, sentinel);
    await ed.edit(eb => {
        eb.insert(ed.selection.active, line);
    });
    ed.selection = new vscode.Selection(
        new vscode.Position(ed.selection.active.line, ed.selection.active.character - line.length + startBuffer),
        new vscode.Position(ed.selection.active.line, ed.selection.active.character - endBuffer),
    );
}

function nearestPreviousNonEmptyLine(ed: vscode.TextEditor, startLine: number): string {
    for (let l = startLine; l >= 0; l--) {
        const line = ed.document.getText(new vscode.Range(l, 0, l + 1, 0)).replace(/\n/g, ' ').trim();
        if (line.length > 0) {
            return line
        }
    }
    return '';
}

function commentLineAndSelection(lang: string, placeholder: string): {line: string, startBuffer: number, endBuffer: number} {
    // Clean up placeholder
    placeholder = placeholder.trim();
    if (placeholder.endsWith('{') || placeholder.endsWith('[') || placeholder.endsWith('(')) {
        placeholder = placeholder.slice(0, placeholder.length - 1).trim();
    }

    switch (lang) {
        case 'go':
            return { line: `log.Printf("# ${placeholder}")`, startBuffer: 'log.Printf("# '.length, endBuffer: 2 };
        case 'javascript':
        case 'typescript':
            return { line: `console.error('# ${placeholder}')`, startBuffer: 'console.error(\'# '.length, endBuffer: 2 };
        default:
            return { line: `no printf syntax found for language ${lang}`, startBuffer: 0, endBuffer: 0 };
    }
}