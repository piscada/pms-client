import './snackbar.css'
import colorLog from '../colorLog'

const AUTO_DISMISS = 6000

// Short hand snacks
export const snack = {
  info(msg, timeout = AUTO_DISMISS) {
    snackbar(msg, 'info', timeout)
  },
  success(msg, timeout = AUTO_DISMISS) {
    snackbar(msg, 'success', timeout)
  },
  warning(msg, timeout = AUTO_DISMISS) {
    snackbar(msg, 'warning', timeout)
  },
  error(msg, timeout = AUTO_DISMISS) {
    snackbar(msg, 'error', timeout)
  }
}

/**
 * Snackbar which can be imported anywhere
 * @param {string} msg  - Message to display
 * @param {string} type - info, warning, error, success
 * @param {number} timeout - how long to suspend snackbar
 */

// Default snackbar
export function snackbar(msg, type = 'info', timeout = AUTO_DISMISS) {
  const baseId = generateID(msg)
  const alreadyUp = getEl(baseId)

  const counterId = baseId + '-counter'
  const endContainerId = baseId + '-container'

  if (!alreadyUp) {
    // Creates new snackbar
    const box = make('div', baseId)

    // Add typeicon
    const typeIcon = createIcon(type, 'type')
    box.appendChild(typeIcon)

    // Set status-text
    const text = make('span', null, msg, ['snackbarText'])
    box.appendChild(text)

    // Set end-container
    const endContainer = make('div', endContainerId, null, 'endContainer')

    // Set dismiss close-icon
    const closeIcon = createIcon('close', 'close')
    closeIcon.classList.add('closeIcon')

    // Counter
    const counter = make('div', counterId, 1, 'counter')
    counter.style.display = 'none'

    // Mounting DOM
    endContainer.appendChild(closeIcon)
    box.appendChild(endContainer)
    endContainer.prepend(counter)

    // Check if snackbars already up. Reuse parent if so.
    let snackbarContainer

    // Mo
    if (!isMainContainerUp()) {
      snackbarContainer = make('div', 'snackbar-container')
      document.body.appendChild(snackbarContainer)
    } else {
      snackbarContainer = getEl('snackbar-container')
    }

    snackbarContainer.prepend(box)

    // Adding animation after created
    box.style.animation = 'slideIn 0.5s'
    box.style.animationFillMode = 'forwards'

    // Adding "show" + type class, which can be "info", "error", "warning", "success"
    box.classList.add('snackbarBox', 'show', type)

    // After animation, remove the show class and remove DOM-reference
    const timer = setTimeout(() => {
      close(box)
    }, timeout)

    // If clicking..
    closeIcon.onclick = () => {
      clearTimeout(timer)
      close(box)
    }
  }

  // Snackbar already exist
  else if (alreadyUp) {
    const c = getEl(counterId)

    if (c.style.display === 'none') {
      c.style.display = 'flex'
    }
    c.textContent = Number(c.textContent) + 1
  }

  colorLog(type + ' :: ' + msg, type)
}

function close(box) {
  // Set animation in motion
  box.style.animation = 'slideOut 0.5s'
  box.style.animationFillMode = 'forwards'

  // Remove from DOM 500ms after..
  setTimeout(() => {
    box.parentNode.removeChild(box)
    box = null
  }, 500)
}

function make(name, id, textContent, klass = []) {
  const el = document.createElement(name)
  if (id) el.id = id
  if (textContent) el.textContent = textContent
  if (klass.length > 0) el.classList.add(klass.toString())
  return el
}

function getEl(hashStr) {
  return document.getElementById(hashStr)
}

function isMainContainerUp() {
  return Boolean(getEl('snackbar-container'))
}

function createIcon(type, name) {
  const div = document.createElement('div')
  const icon = getIcon(type, name === 'close' ? '20px' : '22px')
  div.innerHTML = icon
  div.classList.add(`${name}Icon`)
  return div
}

function getIcon(type, size = '24px', fillColor = '#fff') {
  const iconsTypes = {
    info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${fillColor}" width="${size}" height="${size}"><path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${fillColor}" width="${size}" height="${size}"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${fillColor}" width="${size}" height="${size}"><path d="M0 0h24v24H0z" fill="none"/><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`,
    success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${fillColor}" width="${size}" height="${size}"><path d="M0 0h24v24H0z" fill="none"/><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${fillColor}" width="${size}" height="${size}"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`
  }

  return iconsTypes[type]
}

function generateID(str) {
  // Generates string of any incoming data
  const stringId = str.toString()

  let hash = 0
  for (let i = 0; i < stringId.length; i++) {
    hash = stringId.charCodeAt(i) + ((hash << 5) - hash)
  }

  // eslint-disable-next-line unicorn/number-literal-case
  const c = (hash & 0x00ffffff).toString(16)

  return 'snack_'.substring(0, 16 - c.length) + c
}
export default snackbar
