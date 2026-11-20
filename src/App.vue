<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import ProductCard from './components/ProductCard.vue'
import CartItem from './components/CartItem.vue'

const CART_KEY = 'football-shop-cart'
const PROMO_KEY = 'football-shop-promo'
const PROMOS = { GOAL10: 0.1, TEAM20: 0.2 }

// ---------- стан ----------
const products = ref([])
const loading = ref(true)
const loadError = ref('')

const category = ref('Усі')
const query = ref('')
const sort = ref('default')

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const cart = ref(readStorage(CART_KEY, []))
const promoInput = ref('')
const promoCode = ref(readStorage(PROMO_KEY, ''))
const promoMessage = ref('')

// ---------- завантаження каталогу через fetch ----------
onMounted(async () => {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}products.json`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    products.value = await res.json()
  } catch (e) {
    loadError.value = 'Не вдалося завантажити каталог. Спробуйте оновити сторінку.'
  } finally {
    loading.value = false
  }
})

// ---------- computed: фільтр, пошук, сортування ----------
const categories = computed(() => ['Усі', ...new Set(products.value.map(p => p.category))])

const visibleProducts = computed(() => {
  const q = query.value.trim().toLowerCase()
  let list = products.value.filter(p => {
    const okCategory = category.value === 'Усі' || p.category === category.value
    const okName = p.name.toLowerCase().includes(q)
    return okCategory && okName
  })
  if (sort.value === 'asc') list = [...list].sort((a, b) => a.price - b.price)
  if (sort.value === 'desc') list = [...list].sort((a, b) => b.price - a.price)
  return list
})

// ---------- computed: кошик ----------
const cartCount = computed(() => cart.value.reduce((s, i) => s + i.qty, 0))
const subtotal = computed(() => cart.value.reduce((s, i) => s + i.price * i.qty, 0))
const discountRate = computed(() => PROMOS[promoCode.value] || 0)
const discount = computed(() => Math.round(subtotal.value * discountRate.value))
const total = computed(() => subtotal.value - discount.value)

function qtyInCart(id) {
  return cart.value.find(i => i.id === id)?.qty || 0
}

// ---------- дії над кошиком ----------
function addToCart(product) {
  const found = cart.value.find(i => i.id === product.id)
  if (found) {
    found.qty++
  } else {
    cart.value.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty: 1
    })
  }
}

function changeQty(id, delta) {
  const item = cart.value.find(i => i.id === id)
  if (!item) return
  item.qty += delta
  if (item.qty <= 0) removeItem(id)
}

function removeItem(id) {
  cart.value = cart.value.filter(i => i.id !== id)
}

function clearCart() {
  cart.value = []
}

function applyPromo() {
  const code = promoInput.value.trim().toUpperCase()
  if (PROMOS[code]) {
    promoCode.value = code
    promoMessage.value = `Промокод застосовано: −${PROMOS[code] * 100}%`
  } else {
    promoCode.value = ''
    promoMessage.value = 'Такого промокоду немає. Спробуйте GOAL10.'
  }
}

function resetFilters() {
  category.value = 'Усі'
  query.value = ''
}

// ---------- watch: збереження в localStorage ----------
watch(cart, val => localStorage.setItem(CART_KEY, JSON.stringify(val)), { deep: true })
watch(promoCode, val => localStorage.setItem(PROMO_KEY, JSON.stringify(val)))
</script>

<template>
  <header class="header">
    <a class="logo" href="#top">Футбольна крамниця</a>
    <a class="cart-link" href="#cart" aria-label="Перейти до кошика">
      Кошик
      <span class="badge" :class="{ empty: cartCount === 0 }">{{ cartCount }}</span>
    </a>
  </header>

  <main id="top">
     <section class="hero">
      <h1>Футбольна екіпіровка для барської команди</h1>
      <p>Обирайте форму, м'ячі та бутси і збирайте кошик за хвилину.</p>
    </section>

    <div class="layout">
      <section class="catalog">
        <div class="toolbar">
          <input
            v-model="query"
            class="field"
            type="search"
            placeholder="Пошук за назвою"
            aria-label="Пошук за назвою"
          />
          <select v-model="sort" class="field" aria-label="Сортування">
            <option value="default">Без сортування</option>
            <option value="asc">Спочатку дешевші</option>
            <option value="desc">Спочатку дорожчі</option>
          </select>
        </div>

        <div class="chips">
          <button
            v-for="c in categories"
            :key="c"
            class="chip"
            :class="{ active: c === category }"
            @click="category = c"
          >
            {{ c }}
          </button>
        </div>

        <p v-if="loading" class="notice">Завантажуємо каталог…</p>
        <p v-else-if="loadError" class="notice error">{{ loadError }}</p>

        <div v-else-if="visibleProducts.length === 0" class="notice">
          <p>За запитом «{{ query }}» у категорії «{{ category }}» нічого не знайдено.</p>
          <button class="btn ghost" @click="resetFilters">Скинути фільтри</button>
        </div>

        <div v-else class="grid">
          <ProductCard
            v-for="p in visibleProducts"
            :key="p.id"
            :product="p"
            :in-cart="qtyInCart(p.id)"
            @add="addToCart"
          />
        </div>
      </section>

      <aside id="cart" class="cart">
        <h2>Кошик <span class="muted">({{ cartCount }})</span></h2>

        <div v-if="cart.length === 0" class="notice">
          <p>Кошик порожній. Додайте щось із каталогу.</p>
        </div>

        <template v-else>
          <ul class="cart-list">
            <CartItem
              v-for="item in cart"
              :key="item.id"
              :item="item"
              @change-qty="changeQty"
              @remove="removeItem"
            />
          </ul>

          <div class="promo">
            <input
              v-model="promoInput"
              class="field"
              placeholder="Промокод"
              aria-label="Промокод"
              @keyup.enter="applyPromo"
            />
            <button class="btn ghost" @click="applyPromo">Застосувати</button>
          </div>
          <p v-if="promoMessage" class="muted small">{{ promoMessage }}</p>

          <dl class="sums">
            <div><dt>Сума</dt><dd>{{ subtotal }} ₴</dd></div>
            <div v-if="discount > 0"><dt>Знижка</dt><dd>−{{ discount }} ₴</dd></div>
            <div class="total"><dt>Разом</dt><dd>{{ total }} ₴</dd></div>
          </dl>

          <button class="btn ghost full" @click="clearCart">Очистити кошик</button>
        </template>
      </aside>
    </div>
  </main>

  <footer class="footer">
    <p>&copy; 2026 Футбольна крамниця. Комп'ютерний практикум № 2, Vue.js.</p>
  </footer>
</template>
