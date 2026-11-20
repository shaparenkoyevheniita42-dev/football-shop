<script setup>
// Дані приходять через props, дія «додати» повертається батьку через emit
defineProps({
  product: { type: Object, required: true },
  inCart: { type: Number, default: 0 }
})
const emit = defineEmits(['add'])

const base = import.meta.env.BASE_URL
</script>

<template>
  <article class="card">
    <img class="card-img" :src="base + product.image" :alt="product.name" loading="lazy" />
    <div class="card-body">
      <span class="tag">{{ product.category }}</span>
      <h3>{{ product.name }}</h3>
      <div class="card-bottom">
        <strong class="price">{{ product.price }} ₴</strong>
        <button class="btn" @click="emit('add', product)">
          {{ inCart ? `У кошику: ${inCart}` : 'До кошика' }}
        </button>
      </div>
    </div>
  </article>
</template>
