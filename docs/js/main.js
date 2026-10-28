// Автокаталог: каталог с фильтрами и карточка автомобиля.
// Данные берутся из data/cars.json, все пути относительные.

const fmtNumber = new Intl.NumberFormat('ru-RU');
const formatPrice = (value) => fmtNumber.format(value) + ' ₽';
const formatMileage = (value) => fmtNumber.format(value) + ' км';

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

async function loadCars() {
  const response = await fetch('data/cars.json');
  if (!response.ok) throw new Error('Не удалось загрузить data/cars.json');
  return response.json();
}

function showError(container, message) {
  container.innerHTML = '<div class="empty">' + escapeHtml(message) + '</div>';
}

/* ---------- Каталог ---------- */

function cardHtml(car) {
  return `
    <a class="card" href="car.html?id=${encodeURIComponent(car.id)}">
      <img src="${escapeHtml(car.photos[0])}" alt="${escapeHtml(car.model)}" loading="lazy">
      <div class="card-body">
        <h2 class="card-title">${escapeHtml(car.model)}</h2>
        <div class="card-meta">${car.year} · ${formatMileage(car.mileage)} · ${escapeHtml(car.body)}</div>
        <div class="price">${formatPrice(car.price)}</div>
      </div>
    </a>`;
}

async function initCatalog() {
  const grid = document.getElementById('grid');
  const count = document.getElementById('count');
  const form = document.getElementById('filters');
  const brandSelect = document.getElementById('f-brand');
  const minInput = document.getElementById('f-min');
  const maxInput = document.getElementById('f-max');

  let cars;
  try {
    cars = await loadCars();
  } catch (err) {
    showError(grid, err.message);
    return;
  }

  [...new Set(cars.map((c) => c.brand))].sort().forEach((brand) => {
    brandSelect.add(new Option(brand, brand));
  });

  function render() {
    const brand = brandSelect.value;
    const min = minInput.value === '' ? 0 : Number(minInput.value);
    const max = maxInput.value === '' ? Infinity : Number(maxInput.value);

    const list = cars.filter((c) =>
      (!brand || c.brand === brand) && c.price >= min && c.price <= max
    );

    count.textContent = 'Найдено автомобилей: ' + list.length + ' из ' + cars.length;
    grid.innerHTML = list.length
      ? list.map(cardHtml).join('')
      : '<div class="empty">Под условия фильтра ничего не подходит. Измените марку или диапазон цены.</div>';
  }

  form.addEventListener('input', render);
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('reset', () => setTimeout(render, 0));
  render();
}

/* ---------- Карточка ---------- */

async function initCar() {
  const container = document.getElementById('car');
  const id = new URLSearchParams(location.search).get('id');

  let cars;
  try {
    cars = await loadCars();
  } catch (err) {
    showError(container, err.message);
    return;
  }

  const car = cars.find((c) => c.id === id);
  if (!car) {
    showError(container, 'Автомобиль не найден. Вернитесь в каталог.');
    return;
  }

  document.title = car.model + ' — Автокаталог';
  container.innerHTML = `
    <figure class="car-photo">
      <img src="${escapeHtml(car.photos[0])}" alt="${escapeHtml(car.model)}, ${car.year}">
      <figcaption>Фото иллюстрирует модель, а не конкретный автомобиль. <a href="sources.html">Автор и лицензия</a>.</figcaption>
    </figure>
    <div class="car-info">
      <h1>${escapeHtml(car.model)}</h1>
      <div class="price">${formatPrice(car.price)}</div>
      <dl class="specs">
        <dt>Марка</dt><dd>${escapeHtml(car.brand)}</dd>
        <dt>Год выпуска</dt><dd>${car.year}</dd>
        <dt>Пробег</dt><dd>${formatMileage(car.mileage)}</dd>
        <dt>Кузов</dt><dd>${escapeHtml(car.body)}</dd>
        <dt>Поколение</dt><dd>${escapeHtml(car.generation)}</dd>
        <dt>Номер объявления</dt><dd>${escapeHtml(car.id)}</dd>
      </dl>
      <p>${escapeHtml(car.description)}</p>
      <a class="btn btn-primary" href="files/прайс.pdf" download>Скачать прайс (PDF)</a>
    </div>`;
}

const page = document.body.dataset.page;
if (page === 'catalog') initCatalog();
if (page === 'car') initCar();
