import Editor from './editor'
import Preview from './preview'
import parser from '../utils/parser'
import compiler from '../utils/compiler'

export default {
  name: 'Vuep',

  props: {
    template: String,
    options: {},
    store: Object,
    mixin: Object,
    codeEditor: {
      default: false,
      type: Boolean
    },
    data: [Boolean, String, Object, Array],
    keepData: Boolean,
    value: String,
    scope: Object,
    iframe: Boolean
  },

  data () {
    return {
      content: '',
      preview: '',
      styles: '',
      error: ''
    }
  },

  render (h) {
    let win
    let editorTemplate
    if (this.codeEditor) {
      editorTemplate = h(Editor, {
        class: 'vuep-editor',
        props: {
          value: this.content,
          options: this.options
        },
        on: {
          change: [this.executeCode, val => this.$emit('input', val)]
        }
      })
    }

    /* istanbul ignore next */
    if (this.error) {
      win = h('div', {
        class: 'vuep-error'
      }, [this.error])
    } else {
      win = h(Preview, {
        class: 'vuep-preview',
        props: {
          value: this.preview,
          styles: this.styles,
          keepData: this.keepData,
          iframe: this.iframe,
          datas: this.data,
          mixin: this.mixin,
          store: this.store
        },
        on: {
          error: this.handleError,
          success: this.successHandler
        }
      })
    }

    return h('div', { class: 'vuep' }, [
      editorTemplate,
      win
    ])
  },

  watch: {
    data: {
      deep: true,
      handler (val) {
        if (this.rendered && this.rendered.$forceUpdate) {
          this.rendered.socketData = this.data
          this.rendered.$forceUpdate()
          this.$forceUpdate()
        }
      }
    },
    value: {
      immediate: true,
      handler (val) {
        val && this.executeCode(val)
      }
    }
  },

  created () {
    this.init()
  },

  methods: {
    successHandler (e) {
      this.rendered = e
    },
    init () {
      /* istanbul ignore next */
      if (this.$isServer) return
      let content = this.template

      if (/^[\.#]/.test(this.template)) {
        const html = document.querySelector(this.template)
        if (!html) throw Error(`${this.template} is not found`)

        /* istanbul ignore next */
        content = html.innerHTML
      }

      if (content) {
        this.executeCode(content)
        this.$emit('input', content)
      }
    },
    handleError (err) {
      /* istanbul ignore next */
      this.error = err
    },

    executeCode (code) {
      this.error = ''
      const result = parser(code)

      /* istanbul ignore next */
      if (result.error) {
        this.error = result.error.message
        return
      }

      const compiledCode = compiler(result, this.scope)

      /* istanbul ignore next */
      if (compiledCode.error) {
        this.error = compiledCode.error.message
        return
      }

      this.content = result.content
      this.preview = compiledCode.result
      if (compiledCode.styles) this.styles = compiledCode.styles
    }
  }
}
