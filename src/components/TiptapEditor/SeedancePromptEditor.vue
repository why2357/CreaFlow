<template>
  <div class="seedance-prompt-editor" :class="{ 'is-focused': isFocused }">
    <textarea
      :value="modelValue"
      @input="handleInput"
      @focus="isFocused = true"
      @blur="isFocused = false"
      class="seedance-textarea"
      rows="3"
      :placeholder="placeholder"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string;
  placeholder?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请输入提示词'
});

const emit = defineEmits<Emits>();

const isFocused = ref(false);

const handleInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
};
</script>

<style scoped lang="scss">
.seedance-prompt-editor {
  width: 100%;
}

.seedance-textarea {
  width: 100%;
  min-height: 60px;
  padding: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  resize: none;
  outline: none;
  font-size: 14px;
  line-height: 1.8;
  transition: border-color 0.2s;

  &:focus {
    border-color: #5252ff;
  }
}
</style>
