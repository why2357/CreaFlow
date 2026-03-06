/**
 * 图片提及扩展 - 用于在富文本中插入参考图片标签
 */
import { Node, mergeAttributes } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import type { MentionNodeAttrs } from '@/types/mention';
import ImageMentionView from './ImageMentionView.vue';

export interface ImageMentionOptions {
  /** HTML 标签名 */
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageMention: {
      /**
       * 插入图片提及
       */
      insertImageMention: (attrs: MentionNodeAttrs) => ReturnType;
    };
  }
}

export const ImageMention = Node.create<ImageMentionOptions>({
  name: 'imageMention',

  // 定义为行内节点，可以和文本在同一行
  group: 'inline',

  // 作为行内元素
  inline: true,

  // 可拖拽
  draggable: true,

  // 不可编辑
  atom: true,

  // 添加属性
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-id'),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }
          return {
            'data-id': attributes.id
          };
        }
      },
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-src'),
        renderHTML: (attributes) => {
          if (!attributes.src) {
            return {};
          }
          return {
            'data-src': attributes.src
          };
        }
      },
      label: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-label'),
        renderHTML: (attributes) => {
          if (!attributes.label) {
            return {};
          }
          return {
            'data-label': attributes.label
          };
        }
      }
    };
  },

  // 解析 HTML
  parseHTML() {
    return [
      {
        tag: 'span[data-type="image-mention"]'
      }
    ];
  },

  // 渲染 HTML
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ 'data-type': 'image-mention' }, HTMLAttributes)];
  },

  // 使用自定义 Vue 组件渲染
  addNodeView() {
    return VueNodeViewRenderer(ImageMentionView as any, {
      // 编辑时不进入编辑模式
      stopEvent: () => true
    });
  },

  // 添加命令
  addCommands() {
    return {
      insertImageMention:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs
          });
        }
    };
  }
});
