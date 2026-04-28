import { Menu, BrowserWindow, type MenuItemConstructorOptions } from 'electron'

const isMac = process.platform === 'darwin'

export function buildApplicationMenu(): Menu {
  const template: MenuItemConstructorOptions[] = [
    // App menu (macOS only — other platforms put these under File / Help)
    ...(isMac
      ? ([
          {
            label: 'Inkset',
            submenu: [
              { role: 'about', label: 'About Inkset' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide', label: 'Hide Inkset' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit', label: 'Quit Inkset' }
            ]
          }
        ] as MenuItemConstructorOptions[])
      : []),
    // File
    {
      label: 'File',
      submenu: [isMac ? { role: 'close' } : { role: 'quit' }]
    },
    // Edit — this is the one that fixes ⌘V + the rest of the clipboard shortcuts.
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? ([
              { role: 'pasteAndMatchStyle' },
              { role: 'delete' },
              { role: 'selectAll' }
            ] as MenuItemConstructorOptions[])
          : ([
              { role: 'delete' },
              { type: 'separator' },
              { role: 'selectAll' }
            ] as MenuItemConstructorOptions[]))
      ]
    },
    // View
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // Window
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? ([
              { type: 'separator' },
              { role: 'front' },
              { type: 'separator' },
              { role: 'window' }
            ] as MenuItemConstructorOptions[])
          : ([{ role: 'close' }] as MenuItemConstructorOptions[]))
      ]
    }
  ]

  return Menu.buildFromTemplate(template)
}

/**
 * Build a right-click context menu appropriate for the element clicked.
 * Editable inputs get the full clipboard suite; selected read-only text
 * gets Copy only; a bare click gets nothing.
 */
export function attachContextMenu(window: BrowserWindow): void {
  window.webContents.on('context-menu', (_evt, params) => {
    const { isEditable, selectionText, editFlags } = params
    const hasSelection = (selectionText ?? '').length > 0
    const template: MenuItemConstructorOptions[] = []

    if (isEditable) {
      template.push(
        { role: 'undo', enabled: editFlags.canUndo },
        { role: 'redo', enabled: editFlags.canRedo },
        { type: 'separator' },
        { role: 'cut', enabled: editFlags.canCut },
        { role: 'copy', enabled: editFlags.canCopy },
        { role: 'paste', enabled: editFlags.canPaste },
        { type: 'separator' },
        { role: 'selectAll', enabled: editFlags.canSelectAll }
      )
    } else if (hasSelection) {
      template.push(
        { role: 'copy', enabled: editFlags.canCopy },
        { type: 'separator' },
        { role: 'selectAll', enabled: editFlags.canSelectAll }
      )
    }

    if (template.length === 0) return
    Menu.buildFromTemplate(template).popup({ window })
  })
}
