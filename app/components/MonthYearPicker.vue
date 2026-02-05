<script setup lang="ts">
interface Props {
  modelValue: string // YYYY-MM format
  placeholder?: string
  disabled?: boolean
  minYear?: number
  maxYear?: number
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select date',
  disabled: false,
  minYear: 1950,
  maxYear: () => new Date().getFullYear() + 10
})

const emit = defineEmits<Emits>()

const isOpen = ref(false)

// Months list (Russian locale)
const months = [
  { value: '01', label: 'Янв' },
  { value: '02', label: 'Фев' },
  { value: '03', label: 'Мар' },
  { value: '04', label: 'Апр' },
  { value: '05', label: 'Май' },
  { value: '06', label: 'Июн' },
  { value: '07', label: 'Июл' },
  { value: '08', label: 'Авг' },
  { value: '09', label: 'Сен' },
  { value: '10', label: 'Окт' },
  { value: '11', label: 'Ноя' },
  { value: '12', label: 'Дек' }
]

// Parse current value
const selectedYear = computed(() => {
  if (!props.modelValue) return String(new Date().getFullYear())
  return props.modelValue.substring(0, 4)
})

const selectedMonth = computed(() => {
  if (!props.modelValue) return ''
  return props.modelValue.substring(5, 7)
})

// Internal state for picker
const pickerYear = ref(selectedYear.value)

// Sync picker year when modelValue changes
watch(() => props.modelValue, () => {
  if (props.modelValue) {
    pickerYear.value = props.modelValue.substring(0, 4)
  }
})

// Full month names for display
const fullMonthNames: Record<string, string> = {
  '01': 'Январь',
  '02': 'Февраль',
  '03': 'Март',
  '04': 'Апрель',
  '05': 'Май',
  '06': 'Июнь',
  '07': 'Июль',
  '08': 'Август',
  '09': 'Сентябрь',
  '10': 'Октябрь',
  '11': 'Ноябрь',
  '12': 'Декабрь'
}

const displayTextFull = computed(() => {
  if (!props.modelValue || !selectedMonth.value) return ''
  return `${fullMonthNames[selectedMonth.value] || ''} ${selectedYear.value}`
})

function selectMonth(month: string) {
  const value = `${pickerYear.value}-${month}`
  emit('update:modelValue', value)
  isOpen.value = false
}

function changeYear(delta: number) {
  const newYear = parseInt(pickerYear.value) + delta
  if (newYear >= props.minYear && newYear <= props.maxYear) {
    pickerYear.value = String(newYear)
  }
}

function isMonthSelected(month: string): boolean {
  return selectedYear.value === pickerYear.value && selectedMonth.value === month
}
</script>

<template>
  <UPopover v-model:open="isOpen">
    <UButton
      color="neutral"
      variant="outline"
      icon="i-lucide-calendar"
      :disabled="disabled"
      class="w-full justify-start font-normal"
      :class="{ 'text-muted': !modelValue }"
    >
      {{ displayTextFull || placeholder }}
    </UButton>

    <template #content>
      <div class="p-3 w-64">
        <!-- Year navigation -->
        <div class="flex items-center justify-between mb-3">
          <UButton
            icon="i-lucide-chevron-left"
            color="neutral"
            variant="ghost"
            size="xs"
            :disabled="parseInt(pickerYear) <= minYear"
            @click="changeYear(-1)"
          />
          <span class="font-semibold text-sm">{{ pickerYear }}</span>
          <UButton
            icon="i-lucide-chevron-right"
            color="neutral"
            variant="ghost"
            size="xs"
            :disabled="parseInt(pickerYear) >= maxYear"
            @click="changeYear(1)"
          />
        </div>

        <!-- Month grid -->
        <div class="grid grid-cols-4 gap-1">
          <UButton
            v-for="month in months"
            :key="month.value"
            :label="month.label"
            size="xs"
            :color="isMonthSelected(month.value) ? 'primary' : 'neutral'"
            :variant="isMonthSelected(month.value) ? 'solid' : 'ghost'"
            class="justify-center"
            @click="selectMonth(month.value)"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
