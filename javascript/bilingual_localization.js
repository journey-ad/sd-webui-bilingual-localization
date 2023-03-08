(function () {
  const customCSS = `
    .bilingual__trans_wrapper {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      font-size: 13px;
      line-height: 1;
    }
    
    .bilingual__trans_wrapper em {
      font-style: normal;
    }

    fieldset span.text-gray-500:has(.bilingual__trans_wrapper),
    .gr-block.gr-box span.text-gray-500:has(.bilingual__trans_wrapper),
    label.block span:has(.bilingual__trans_wrapper) {
      top: -0.8em;
      line-height: 1;
    }

    #txtimg_hr_finalres .bilingual__trans_wrapper em,
    #tab_ti .output-html .bilingual__trans_wrapper em,
    #dynamic-prompting .output-html .bilingual__trans_wrapper em,
    #txt2img_script_container .output-html .bilingual__trans_wrapper em,
    #available_extensions .extension-tag .bilingual__trans_wrapper em {
      display: none;
    }
    
    #settings .bilingual__trans_wrapper:not(#settings .tabitem .bilingual__trans_wrapper),
    label>span>.bilingual__trans_wrapper,
    .w-full>span>.bilingual__trans_wrapper,
    .output-html .bilingual__trans_wrapper:not(th .bilingual__trans_wrapper),
    .output-markdown .bilingual__trans_wrapper,
    .posex_setting_cont .bilingual__trans_wrapper:not(.posex_bg .bilingual__trans_wrapper) /* Posex extension */
    {
      font-size: 12px;
      align-items: flex-start;
    }

    #extensions label .bilingual__trans_wrapper,
    #available_extensions td .bilingual__trans_wrapper {
      font-size: inherit;
      line-height: inherit;
    }
    
    textarea::placeholder {
      line-height: 1;
      padding: 4px 0;
    }
    
    label>span {
      line-height: 1;
    }
    
    div[data-testid="image"]>div>div.touch-none>div {
      background-color: rgba(255, 255, 255, .6);
      color: #222;
    }
    
    /* Posex extension */
    .posex_bg {
      white-space: nowrap;
    }
    `

  let i18n = null, i18nRegex = {}, config = null;

  // First load
  function setup() {
    config = {
      enabled: opts["bilingual_localization_enabled"],
      file: opts["bilingual_localization_file"],
      dirs: opts["bilingual_localization_dirs"],
      order: opts["bilingual_localization_order"],
      enableLogger: opts["bilingual_localization_logger"]
    }

    let { enabled, file, dirs, enableLogger } = config

    if (!enabled || file === "None" || dirs === "None") return

    dirs = JSON.parse(dirs)

    enableLogger && logger.init('Bilingual')
    logger.log('Bilingual Localization initialized.')

    // Load localization file
    i18n = JSON.parse(readFile(dirs[file]), (key, value) => {
      // parse regex translations
      if (key.startsWith('@@')) {
        i18nRegex[key.slice(2)] = value
      } else {
        return value
      }
    })

    logger.group('Localization file loaded.')
    logger.log('i18n', i18n)
    logger.log('i18nRegex', i18nRegex)
    logger.groupEnd()

    translatePage()
  }

  // Translate page
  function translatePage() {
    if (!i18n) return

    logger.time('Full Page')
    querySelectorAll([
      "label span, fieldset span, button", // major label and button description text
      "textarea[placeholder], select, option", // text box placeholder and select element
      ".transition > div > span:not([class])", // collapse panel added by extension
      ".tabitem .pointer-events-none", // upper left corner of image upload panel
      "#modelmerger_interp_description .output-html", // model merger description
      "#lightboxModal span" // image preview lightbox
    ])
      .forEach(el => translateEl(el, { deep: true }))

    querySelectorAll([
      'div[data-testid="image"] > div > div', // description of image upload panel
      '#extras_image_batch > div', //  description of extras image batch file upload panel
      ".output-html:not(#footer), .output-markdown", // output html exclude footer
      '#dynamic-prompting' // dynamic-prompting extension
    ])
      .forEach(el => translateEl(el, { rich: true }))

    logger.timeEnd('Full Page')
  }

  const ignore_selector = [
    '.bilingual__trans_wrapper', // self
    '.resultsFlexContainer', // tag-autocomplete
    '#setting_sd_model_checkpoint select', // model checkpoint
    '#setting_sd_vae select', // vae model
    '#txt2img_styles, #img2txt_styles', // styles select
    '.extra-network-cards .card .actions .name', // extra network cards name
    'script, style, svg, g, path', // script / style / svg elements
  ]
  // Translate element
  function translateEl(el, { deep = false, rich = false } = {}) {
    if (!i18n) return // translation not ready.
    if (el.matches?.(ignore_selector)) return // ignore some elements.

    if (el.title) {
      doTranslate(el, el.title, 'title')
    }

    if (el.placeholder) {
      doTranslate(el, el.placeholder, 'placeholder')
    }

    if (el.tagName === 'OPTION') {
      doTranslate(el, el.textContent, 'option')
    }

    if (deep || rich) {
      Array.from(el.childNodes).forEach(node => {
        if (node.nodeName === '#text') {
          if (rich) {
            doTranslate(node, node.textContent, 'text')
            return
          }

          if (deep) {
            doTranslate(node, node.textContent, 'element')
          }
        } else if (node.childNodes.length > 0) {
          translateEl(node, { deep, rich })
        }
      })
    } else {
      doTranslate(el, el.textContent, 'element')
    }
  }

  const re_num = /^[\.\d]+$/,
    re_emoji = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]/u

  function doTranslate(el, source, type) {
    if (el.__bilingual_localization_translated) return
    source = source.trim()
    if (!source) return
    if (re_num.test(source)) return
    // if (re_emoji.test(source)) return

    let translation = i18n[source]

    if (!translation) {
      for (let regex in i18nRegex) {
        regex = getRegex(regex)
        if (regex && regex.test(source)) {
          logger.log('regex', regex, source)
          translation = source.replace(regex, i18nRegex[regex])
          break;
        }
      }
    }

    if (!translation) return
    if (source === translation) return

    if (config.order === "Original First") {
      [source, translation] = [translation, source]
    }

    switch (type) {
      case 'text':
        el.textContent = translation
        break;

      case 'element':
        const htmlStr = `<div class="bilingual__trans_wrapper">${htmlEncode(translation)}<em>${htmlEncode(source)}</em></div>`
        const htmlEl = parseHtmlStringToElement(htmlStr)
        if (el.hasChildNodes()) {
          const textNode = Array.from(el.childNodes).find(node => node.nodeName === '#text' && node.textContent.trim() === source)

          textNode && textNode.replaceWith(htmlEl)
        } else {
          el.replaceWith(htmlEl)
        }
        Object.defineProperty(el, '__bilingual_localization_translated', { value: true })
        break;

      case 'option':
        el.textContent = `${translation} (${source})`
        break;

      case 'title':
        el.title = `${translation}\n${source}`
        break;

      case 'placeholder':
        el.placeholder = `${translation}\n\n${source}`
        break;

      default:
        return translation
    }
  }

  function querySelector(...args) {
    return gradioApp()?.querySelector(...args)
  }

  function querySelectorAll(...args) {
    return gradioApp()?.querySelectorAll(...args)
  }

  function parseHtmlStringToElement(htmlStr) {
    const template = document.createElement('template')
    template.insertAdjacentHTML('afterbegin', htmlStr)
    return template.firstElementChild
  }

  function htmlEncode(htmlStr) {
    return htmlStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  // get regex object from string
  function getRegex(regex) {
    try {
      regex = regex.trim();
      let parts = regex.split('/');
      if (regex[0] !== '/' || parts.length < 3) {
        regex = regex.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); //escap common string
        return new RegExp(regex);
      }

      const option = parts[parts.length - 1];
      const lastIndex = regex.lastIndexOf('/');
      regex = regex.substring(1, lastIndex);
      return new RegExp(regex, option);
    } catch (e) {
      return null
    }
  }

  // Load file
  function readFile(filePath) {
    let request = new XMLHttpRequest();
    request.open("GET", `file=${filePath}`, false);
    request.send(null);
    return request.responseText;
  }

  const logger = (function () {
    const loggerTimerMap = new Map()
    const loggerConf = { badge: true, label: 'Logger', enable: false }
    return new Proxy(console, {
      get: (target, propKey) => {
        if (propKey === 'init') {
          return (label) => {
            loggerConf.label = label
            loggerConf.enable = true
          }
        }

        if (!(propKey in target)) return undefined

        return (...args) => {
          if (!loggerConf.enable) return

          let color = ['#39cfe1', '#006cab']

          let label, start
          switch (propKey) {
            case 'error':
              color = ['#f70000', '#a70000']
              break;
            case 'warn':
              color = ['#f7b500', '#b58400']
              break;
            case 'time':
              label = args[0]
              if (loggerTimerMap.has(label)) {
                logger.warn(`Timer '${label}' already exisits`)
              } else {
                loggerTimerMap.set(label, performance.now())
              }
              return
            case 'timeEnd':
              label = args[0], start = loggerTimerMap.get(label)
              if (start === undefined) {
                logger.warn(`Timer '${label}' does not exist`)
              } else {
                loggerTimerMap.delete(label)
                logger.log(`${label}: ${performance.now() - start} ms`)
              }
              return
            case 'groupEnd':
              loggerConf.badge = true
              break
          }

          const badge = loggerConf.badge ? [`%c${loggerConf.label}`, `color: #fff; background: linear-gradient(180deg, ${color[0]}, ${color[1]}); text-shadow: 0px 0px 1px #0003; padding: 3px 5px; border-radius: 4px;`] : []

          target[propKey](...badge, ...args)

          if (propKey === 'group' || propKey === 'groupCollapsed') {
            loggerConf.badge = false
          }
        }
      }
    })
  }())

  function init() {
    // Add style to dom
    let $styleEL = document.createElement('style');

    if ($styleEL.styleSheet) {
      $styleEL.styleSheet.cssText = customCSS;
    } else {
      $styleEL.appendChild(document.createTextNode(customCSS));
    }
    gradioApp().appendChild($styleEL);

    let loaded = false
    let _count = 0

    const observer = new MutationObserver(mutations => {
      if (Object.keys(localization).length) return; // disabled if original translation enabled
      if (Object.keys(opts).length === 0) return; // does nothing if opts is not loaded

      let _nodesCount = 0, _now = performance.now()

      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          _nodesCount++
          translateEl(mutation.target)
        } else {
          mutation.addedNodes.forEach(node => {
            if (node.className === 'bilingual__trans_wrapper') return

            _nodesCount++
            if (node.nodeType === 1 && node.className === 'output-html') {
              translateEl(node, { rich: true })
            } else {
              translateEl(node, { deep: true })
            }
          })
        }
      }

      if (_nodesCount > 0) {
        logger.info(`UI Update #${_count++}: ${performance.now() - _now} ms, ${_nodesCount} nodes`, mutations)
      }

      if (loaded) return;
      if (i18n) return;

      loaded = true
      setup()
    })

    observer.observe(gradioApp(), {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['title', 'placeholder']
    })
  }

  // Init after page loaded
  document.addEventListener('DOMContentLoaded', init)
})();
