(function () {
  const EXT_BASE = 'extensions/sd-webui-zh_cn'
  const customCSS = `
    .custom_ui__trans_wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 12px;
      line-height: 1;
    }
    
    .custom_ui__trans_wrapper em {
      font-size: 12px;
      font-style: normal;
    }
    
    .custom_ui__prompt_trans {
      font-size: 12px;
    }
    
    #settings .custom_ui__trans_wrapper,
    label>span>.custom_ui__trans_wrapper,
    .w-full>span>.custom_ui__trans_wrapper {
      align-items: flex-start;
    }
    
    textarea::placeholder {
      font-size: 12px;
      line-height: 1;
      padding: 5px 0;
    }
    
    label>span {
      line-height: 1;
    }
    
    div[data-testid="image"]>div>div.touch-none>div {
      background-color: rgba(255, 255, 255, .6);
      color: #222;
    }
    
    #txt2img_generate, #img2img_generate {
      scroll-margin-bottom: 50px;
    }`

  let labelMap = {} // 提示标签->id引用映射
  // 构造标签引用映射
  function buildLabelReferenceMap(tab = 'tab_txt2img') {
    return [...querySelectorAll(`#${tab} label[for] span`)].reduce((labelMap, span) => {
      const label = span.parentNode,
        key = span.textContent.trim(),
        val = label.getAttribute('for')

      labelMap[key] = val

      return labelMap
    }, {})
  }

  // 加载本地化语料
  const i18n = JSON.parse(readFile(`${EXT_BASE}/i18n/i18n.json`))

  // 翻译页面
  function translatePage() {
    // const selector = ['tab_txt2img', 'tab_img2img', 'tab_extras', 'tab_pnginfo'].map(tab => `#${tab} label span, #${tab} button`).join(',')
    [...querySelectorAll('label span, fieldset span, th span, button, textarea[placeholder], select[title], option, div.transition > div > span:not([class]), .tabitem .pointer-events-none, #lightboxModal span, thead th, .output-html')].forEach(el => translateEl(el));
    [...querySelectorAll('.output-html:not(#footer) p, .output-html tabel:not(#extensions), div[data-testid="image"] > div > div, #extras_image_batch > div, .extension-tag')].forEach(el => translateEl(el, 'node'));
  }

  // 翻译元素
  function translateEl(el, type) {
    if (el.className === 'custom_ui__trans_wrapper') return

    if (type === 'node') {
      Array.from(el.childNodes).forEach(node => {
        if (node.nodeName === '#text') {
          doTranslate(node, node.textContent, 'node')
        } else if (node.childNodes.length > 0) {
          translateEl(node, 'node')
        }
      })
      return
    }

    if (el.textContent && el.tagName !== 'SELECT') {
      if (el.tagName === 'OPTION') {
        doTranslate(el, el.textContent, 'option')
      } else {
        doTranslate(el, el.textContent, 'element')
      }
    }

    if (el.title) {
      doTranslate(el, el.title, 'title')
    }

    if (el.placeholder) {
      doTranslate(el, el.placeholder, 'placeholder')
    }
  }

  function doTranslate(el, source, type) {
    source = source.trim()

    if (!source) return

    const translate = i18n[source]

    if (!translate) return
    if (source === translate) return

    switch (type) {
      case 'node':
        el.textContent = translate
        break;

      case 'element':
        if (el.childNodes.length === 1 || !el.classList.contains('pointer-events-none')) {
          el.innerHTML = `<div class="custom_ui__trans_wrapper"><em>${translate}</em>${source}</div>`
        } else {
          const textNode = Array.from(el.childNodes).find(node => node.nodeName === '#text' && node.textContent.trim() === source)
          if (textNode) {
            textNode.textContent = `${translate} (${source})`
          }
        }

        break;

      case 'option':
        el.textContent = `${translate} (${source})`
        break;

      case 'title':
        el.title = `${translate}\n${source}`
        break;

      case 'placeholder':
        el.placeholder = `${translate}\n\n${source}`
        break;
    }
  }

  let tagsI18n = null
  // 翻译标签
  function translatePrompt(text) {
    if (!tagsI18n) {
      let _tmp_list = loadCSV(`${EXT_BASE}/i18n/tags_i18n.csv`)
      tagsI18n = _tmp_list.reduce((tagsI18n, [tag, _, i18n]) => {
        if (!tag || !i18n || tag === i18n) return tagsI18n // 过滤无效数据

        tagsI18n[tag] = i18n
        return tagsI18n
      }, {})
    }

    /* 转小写并去除多余空格和权重字符，保留转义括号
      '{{masterpiece}}, (best quality:1.215), [lowkey:0.03], keyboard \\(computer\\)'
      => 'masterpiece, best quality, lowkey, keyboard (computer)'
    */
    let index = 0
    let promptText = text
      .toLowerCase() // 转小写
      .replace(/\s\s+/g, ' ') // 去除多余空格
      .replace(/:(\d*\.?\d*)/g, '') // 去除权重值
      .replace(/\\[(){}\[\]]/g, '\uFFFF') // 暂存转义括号为特殊字符
      .replace(/[(){}\[\]]/g, '') // 去除其余所有括号
      .replace(/\uFFFF/g, () => ['(', ')'][index++ % 2]) // 还原转义括号

    // 按逗号分割匹配翻译
    const promptList = promptText
      .split(/,|，/)
      .map(tag => {
        tag = tag.trim()
        let parsed_tag = tag.replace(/\s+/g, '_')
        return tagsI18n[parsed_tag] || tag
      })

    const promptTrans = promptList.join(', ')

    return promptTrans
  }

  // 节流函数
  function throttle(fn, delay) {
    let timer = null

    return function () {
      if (timer) return

      fn.apply(this, arguments)

      timer = setTimeout(() => {
        timer = null
      }, delay)
    }
  }

  // 防抖函数
  function debounce(fn, delay) {
    let ts = 0, timer = null

    return function () {
      if (Date.now() - ts < delay) {
        clearTimeout(timer)
        timer = setTimeout(() => {
          fn.apply(this, arguments)
        }, delay)

        return
      }

      clearTimeout(timer)
      fn.apply(this, arguments)

      ts = Date.now()
    }
  }

  function querySelector(...args) {
    return gradioApp()?.querySelector(...args)
  }

  function querySelectorAll(...args) {
    return gradioApp()?.querySelectorAll(...args)
  }

  // 通过标签选择对应配置项元素
  function querySelectorByLabel(label, tab = 'tab_txt2img') {
    const id = labelMap[tab][label]

    if (!id) return

    return querySelector(`#${id}`)
  }

  // 通过选择器模拟触发修改值
  function changeVal(selector, value) {
    const el = selector instanceof Element ? selector : querySelector(selector)
    el.value = value

    const event = new Event('input', { bubbles: true })
    Object.defineProperty(event, 'target', { writable: false, value: el });
    el.dispatchEvent(event)

    el.dispatchEvent(new Event('focusout')) // 兼容tagAutocomplete插件
  }

  // 通过标签修改值
  function changeValByLabel(label, value, tab = 'tab_txt2img') {
    const _gradio_conf = gradio_config.components.find(_ => _.props.label === label)
    if (_gradio_conf) _gradio_conf.props.value = value

    const id = labelMap[tab][label]

    if (!id) {
      if (_gradio_conf) {
        const { elem_id } = _gradio_conf.props
        const _el = querySelector(`#${elem_id}`).querySelector('input, textarea, select')
        _el && changeVal(_el, value)
      }

      return
    }

    changeVal(`#${id}`, value)
  }

  // Load file
  function readFile(filePath) {
    let request = new XMLHttpRequest();
    request.open("GET", `file=${filePath}`, false);
    request.send(null);
    return request.responseText;
  }

  // Load CSV
  function loadCSV(path) {
    let text = readFile(path);
    return parseCSV(text);
  }

  // Parse the CSV file into a 2D array. Doesn't use regex, so it is very lightweight.
  function parseCSV(str) {
    var arr = [];
    var quote = false;  // 'true' means we're inside a quoted field

    // Iterate over each character, keep track of current row and column (of the returned array)
    for (var row = 0, col = 0, c = 0; c < str.length; c++) {
      var cc = str[c], nc = str[c + 1];        // Current character, next character
      arr[row] = arr[row] || [];             // Create a new row if necessary
      arr[row][col] = arr[row][col] || '';   // Create a new column (start with empty string) if necessary

      // If the current character is a quotation mark, and we're inside a
      // quoted field, and the next character is also a quotation mark,
      // add a quotation mark to the current column and skip the next character
      if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }

      // If it's just one quotation mark, begin/end quoted field
      if (cc == '"') { quote = !quote; continue; }

      // If it's a comma and we're not in a quoted field, move on to the next column
      if (cc == ',' && !quote) { ++col; continue; }

      // If it's a newline (CRLF) and we're not in a quoted field, skip the next character
      // and move on to the next row and move to column 0 of that new row
      if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }

      // If it's a newline (LF or CR) and we're not in a quoted field,
      // move on to the next row and move to column 0 of that new row
      if (cc == '\n' && !quote) { ++row; col = 0; continue; }
      if (cc == '\r' && !quote) { ++row; col = 0; continue; }

      // Otherwise, append the current character to the current column
      arr[row][col] += cc;
    }
    return arr;
  }

  // 添加自定义UI
  function add_custom_ui() {
    // 未获取到gradio-app重试
    if (!document.getElementsByTagName('gradio-app').length) {
      requestAnimationFrame(add_custom_ui)
      return
    }

    // 防止重复添加
    if (querySelector('#custom_preset')) return

    // 未获取到注入点dom重试
    const $txt2imgTabEl = querySelector('#tab_txt2img')
    if (!$txt2imgTabEl) {
      requestAnimationFrame(add_custom_ui)
      return
    }
    
    // Add style to dom
    let $styleEL = document.createElement('style');

    if ($styleEL.styleSheet) {
      $styleEL.styleSheet.cssText = customCSS;
    } else {
      $styleEL.appendChild(document.createTextNode(customCSS));
    }
    gradioApp().appendChild($styleEL);

    // 构造标签引用映射
    labelMap = {
      tab_txt2img: buildLabelReferenceMap('tab_txt2img'),
      tab_img2img: buildLabelReferenceMap('tab_img2img'),
      tab_extras: buildLabelReferenceMap('tab_extras'),
      tab_pnginfo: buildLabelReferenceMap('tab_pnginfo'),
    }

    // UI更新时翻译页面
    onUiUpdate(translatePage)

    // 添加prompt翻译框
    querySelectorAll('#txt2img_prompt textarea, #img2img_prompt textarea').forEach(el => {
      const $wrapper = document.createElement('div')
      $wrapper.className = 'custom_ui__prompt_trans text-sm text-gray-400'

      // 内容变动时执行翻译
      el.addEventListener('input', debounce((e) => {
        const text = el.value.trim()

        const promptTrans = translatePrompt(text)

        $wrapper.textContent = promptTrans
      }, 500))

      el.insertAdjacentElement('afterend', $wrapper)
    })
  }

  add_custom_ui()
})();
