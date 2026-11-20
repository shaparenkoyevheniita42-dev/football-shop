<script setup>
defineProps({
  item: { type: Object, required: true }
})
// Три події: змінити кількість, видалити
const emit = defineEmits(['change-qty', 'remove'])

const base = import.meta.env.BASE_URL
</script>

<template>
  <li class="cart-item">
    <img :src="base + item.image" :alt="item.name" />
    <div class="cart-info">
      <h4>{{ item.name }}</h4>
      <span class="muted">{{ item.price }} ₴ × {{ item.qty }} = {{ item.price * item.qty }} ₴</span>
      <div class="qty">
        <button class="qty-btn" aria-label="Менше" @click="emit('change-qty', item.id, -1)">−</button>
        <span>{{ item.qty }}</span>
        <button class="qty-btn" aria-label="Більше" @click="emit('change-qty', item.id, 1)">+</button>
        <button class="remove" @click="emit('remove', item.id)">Видалити</button>
      </div>
    </div>
  </li>
</template>
