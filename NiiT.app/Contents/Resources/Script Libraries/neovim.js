#!/usr/bin/env osascript -l JavaScript

const neovimExecutable = "nvim"
const neovimArguments = ""

const app = Application("iTerm")

function frontmostNeovimWindow() {
  for (let window of app.windows()) {
    for (let tab of window.tabs()) {
      for (let session of tab.sessions()) {
        if (session.variable({named: "user.isNeovim"}))
          return window
      }
    }
  }

  return null
}

function neovimTab(tab) {
  for (let session of tab.sessions()) {
    session.setVariable({named: "user.isNeovim", to: true})
  }

  return tab
}

function newWindow({withProfile: profile}) {
  try {
    return app.createWindowWithProfile(profile)
  } catch {
    return app.createWindowWithDefaultProfile()
  }
}

function newTab({in: window, withProfile: profile}) {
  if (window) {
    try {
      return window.createTab({withProfile: profile})
    } catch {
      return window.createTabWithDefaultProfile()
    }
  }

  return newWindow({withProfile: profile}).tabs()[0]
}


function newNeovimTab({in: window, withProfile: profile = "Neovim"} = {window}) {
  return neovimTab(newTab({in: window, withProfile: profile}))
}

function quoteString(text) {
  return "\"" + text + "\""
}

function quotePath(path) {
  if (path == "")
    return path

  return quoteString(path)
}

function neovimCommand({withPath: path}) {
  return [neovimExecutable, neovimArguments, quotePath(path)].filter(Boolean).join(" ")
}

function execute({command, in: tab, sessionIndex = 0, exitAfter = false, noHistory = false} = {command, tab}) {
  if (exitAfter)
    command += "; exit"

  if (noHistory)
    command = " " + command

  var sessions = tab.sessions()
  sessions[sessionIndex].write({text: command})
}

function run(paths) {
  if (paths.length > 0) {
    for (let path of paths) {
      execute({command: neovimCommand({withPath: path}),
        in: newNeovimTab({in: frontmostNeovimWindow()}), exitAfter: true, noHistory: true})
    }
  } else {
    execute({command: neovimCommand({withPath: ""}),
      in: newNeovimTab({in: frontmostNeovimWindow()}), exitAfter: true, noHistory: true})
  }

  app.activate()
}
