import { app, shell, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerEditingIpc } from './ipc/editingIpc'
import { registerKdpFormatIpc } from './ipc/kdpFormatIpc'
import { registerCoverIpc } from './ipc/coverIpc'
import { registerVersionsIpc } from './ipc/versionsIpc'
import { registerSettingsIpc } from './ipc/settingsIpc'
import { loadAllEnv } from './services/envService'
import { attachContextMenu, buildApplicationMenu } from './menu'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 640,
    title: 'Inkset',
    show: false,
    // macOS always shows the menu bar at the top of the screen; `autoHideMenuBar`
    // only affects Windows / Linux. Keep it on so those platforms don't grow a
    // redundant bar, but the Mac menu bar (with our Edit → Paste items) is
    // always visible up top.
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Right-click on any editable input → clipboard context menu.
  attachContextMenu(mainWindow)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.deimira.inkset')

  // Install the application menu before the first window opens so its
  // accelerators (⌘V / ⌘C / ⌘Z / …) are active on first paint.
  Menu.setApplicationMenu(buildApplicationMenu())

  // Load user-level .env + dev fallbacks before any service starts up.
  loadAllEnv()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  registerEditingIpc()
  registerKdpFormatIpc()
  registerCoverIpc()
  registerVersionsIpc()
  registerSettingsIpc()

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
