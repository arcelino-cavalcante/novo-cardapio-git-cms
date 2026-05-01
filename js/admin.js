import { showCustomAlert, showCustomConfirm } from './ui.js';
import { fetchDB, normalizeDB, defaultDB, money, escapeAttr, generateId } from './db.js';

let DB = defaultDB();
let editingProductId = null;
let editingCategoryId = null;
let editingSitioId = null;
let editingMonteSeuId = null;
let editingOptionGroupId = null;
let productFilterCategory = '';
let productSearchTerm = '';
let unsubscribeSnapshot = null;
let hasInitializedUI = false;

// DOM Elements - Tabs
const tabProdutos = document.getElementById('tabProdutos');
const tabCategorias = document.getElementById('tabCategorias');
const tabMonteSeu = document.getElementById('tabMonteSeu');
const tabOpcionais = document.getElementById('tabOpcionais');
const tabInfo = document.getElementById('tabInfo');
const tabTaxas = document.getElementById('tabTaxas');
const tabEntregadores = document.getElementById('tabEntregadores');

const viewProdutos = document.getElementById('viewProdutos');
const viewCategorias = document.getElementById('viewCategorias');
const viewMonteSeu = document.getElementById('viewMonteSeu');
const viewOpcionais = document.getElementById('viewOpcionais');
const viewInfo = document.getElementById('viewInfo');
const viewTaxas = document.getElementById('viewTaxas');
const viewEntregadores = document.getElementById('viewEntregadores');

// DOM Elements - Couriers
const courierName = document.getElementById('courierName');
const courierPhone = document.getElementById('courierPhone');
const btnAddCourier = document.getElementById('btnAddCourier');
const gridCouriers = document.getElementById('gridCouriers');
const dispatchModal = document.getElementById('dispatchModal');
const dispatchList = document.getElementById('dispatchList');
const dispatchOrderId = document.getElementById('dispatchOrderId');
let currentDispatchOrderId = null; // To store ID while modal is open

// DOM Elements - Auth
const authScreen = document.getElementById('authScreen');
const authForm = document.getElementById('authForm');
const authPassword = document.getElementById('authPassword');
const authSubmit = document.getElementById('authSubmit');
const authError = document.getElementById('authError');
const logoutBtn = document.getElementById('logoutBtn');
const GITHUB_REPO = 'arcelino-cavalcante/novo-cardapio-git-cms';
let githubToken = localStorage.getItem('lamundo_gh_token');

// DOM Elements - Products
const pName = document.getElementById('pName');
const pDescription = document.getElementById('pDescription');
const pCategory = document.getElementById('pCategory');
const pOptionGroup = document.getElementById('pOptionGroup');
const pImage = document.getElementById('pImage');
const pFileInput = document.getElementById('pFileInput');
const pUploadStatus = document.getElementById('pUploadStatus');
const pPrice = document.getElementById('pPrice');
const pOfferPrice = document.getElementById('pOfferPrice');
const pPriceP = document.getElementById('pPriceP');
const pPriceM = document.getElementById('pPriceM');
const pPriceG = document.getElementById('pPriceG');
const pOfferPriceP = document.getElementById('pOfferPriceP');
const pOfferPriceM = document.getElementById('pOfferPriceM');
const pOfferPriceG = document.getElementById('pOfferPriceG');
const pAvailable = document.getElementById('pAvailable');
const btnSaveProduct = document.getElementById('btnSaveProduct');
const gridProducts = document.getElementById('gridProducts');
const boxPricesSimple = document.getElementById('boxPricesSimple');
const boxPricesSimpleOffer = document.getElementById('boxPricesSimpleOffer');
const boxPricesSizes = document.getElementById('boxPricesSizes');
const boxPricesSizesOffer = document.getElementById('boxPricesSizesOffer');
const productFilterButtons = document.getElementById('productFilterButtons');
const productSearch = document.getElementById('productSearch');

// DOM Elements - Categories
const cName = document.getElementById('cName');
const cUseSizes = document.getElementById('cUseSizes');
const cAllowHalfWrapper = document.getElementById('cAllowHalfWrapper');
const cAllowHalf = document.getElementById('cAllowHalf');
const cOptionGroup = document.getElementById('cOptionGroup');
const btnSaveCategory = document.getElementById('btnSaveCategory');
const gridCategories = document.getElementById('gridCategories');

// DOM Elements - Taxas
const tBase = document.getElementById('tBase');
const btnSaveBase = document.getElementById('btnSaveBase');
const sName = document.getElementById('sName');
const sFee = document.getElementById('sFee');
const btnSaveSitio = document.getElementById('btnSaveSitio');
const gridSitios = document.getElementById('gridSitios');

// DOM Elements - Monte Seu
const msName = document.getElementById('msName');
const msType = document.getElementById('msType');
const msBoxBasePrice = document.getElementById('msBoxBasePrice');
const msBasePrice = document.getElementById('msBasePrice');
const msBoxSizes = document.getElementById('msBoxSizes');
const msSizesContainer = document.getElementById('msSizesContainer');
const msBtnAddSize = document.getElementById('msBtnAddSize');
const msAddonsContainer = document.getElementById('msAddonsContainer');
const msBtnAddAddon = document.getElementById('msBtnAddAddon');
const btnSaveMonteSeu = document.getElementById('btnSaveMonteSeu');
const gridMonteSeu = document.getElementById('gridMonteSeu');

// DOM Elements - Opcionais
const ogName = document.getElementById('ogName');
const ogLabel = document.getElementById('ogLabel');
const ogOptionsContainer = document.getElementById('ogOptionsContainer');
const ogBtnAddOption = document.getElementById('ogBtnAddOption');
const btnSaveOptionGroup = document.getElementById('btnSaveOptionGroup');
const gridOptionGroups = document.getElementById('gridOptionGroups');

// DOM Elements - Info
const infoDescription = document.getElementById('infoDescription');
const infoAddress = document.getElementById('infoAddress');
const infoWhatsapp = document.getElementById('infoWhatsapp');
const infoInstagram = document.getElementById('infoInstagram');
const infoOpen = document.getElementById('infoOpen');
const infoPrinterIp = document.getElementById('infoPrinterIp');
const btnSaveInfo = document.getElementById('btnSaveInfo');

// --- Helpers ---
function sanitizeSizePrices(values) {
    const result = {};
    Object.entries(values).forEach(([key, rawValue]) => {
        const numeric = Number(rawValue || 0);
        if (numeric > 0) result[key] = numeric;
    });
    return Object.keys(result).length ? result : undefined;
}

async function persistDB() {
    // Apenas mantém o estado em memória. O salvamento real ocorre no botão "Salvar e Publicar".
    // Se quiser que salve no localStorage como backup local temporário, pode ser feito aqui.
}

const btnPublishGitHub = document.getElementById('btnPublishGitHub');
if (btnPublishGitHub) {
    btnPublishGitHub.addEventListener('click', async () => {
        if (!githubToken) {
            showCustomAlert('Você precisa estar logado com seu Token do GitHub.');
            return;
        }

        btnPublishGitHub.disabled = true;
        const originalText = btnPublishGitHub.innerHTML;
        btnPublishGitHub.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publicando...';
        
        try {
            // 1. Get current file SHA
            const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/data.json`, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (!getRes.ok) throw new Error('Falha ao acessar o repositório. Verifique se o Token tem permissão de "repo".');
            const fileData = await getRes.json();
            const currentSha = fileData.sha;

            // 2. Prepare new content (base64)
            const plain = JSON.parse(JSON.stringify(DB));
            const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(plain, null, 2))));

            // 3. Commit to GitHub
            const putRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/data.json`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Atualização do cardápio via Admin',
                    content: newContent,
                    sha: currentSha
                })
            });

            if (putRes.ok) {
                showCustomAlert('Alterações publicadas com sucesso! O site será atualizado em ~1 minuto.');
            } else {
                const errData = await putRes.json();
                throw new Error(errData.message || 'Erro ao fazer commit');
            }
        } catch (error) {
            console.error('Erro ao publicar:', error);
            showCustomAlert('Erro ao publicar: ' + error.message);
        } finally {
            btnPublishGitHub.disabled = false;
            btnPublishGitHub.innerHTML = originalText;
        }
    });
}

// --- Tabs Logic ---
function switchTab(tab) {
    // Hide all views
    [viewProdutos, viewCategorias, viewMonteSeu, viewOpcionais, viewInfo, viewTaxas, viewEntregadores].forEach(v => {
        if (v) v.classList.add('hidden');
    });

    // Reset tabs
    [tabProdutos, tabCategorias, tabMonteSeu, tabOpcionais, tabInfo, tabTaxas, tabEntregadores].forEach(t => {
        if (t) t.className = 'px-4 py-2 rounded-lg bg-white border';
    });

    if (tab === 'Produtos') {
        if (viewProdutos) viewProdutos.classList.remove('hidden');
        if (tabProdutos) tabProdutos.className = 'px-4 py-2 rounded-lg bg-brand-600 text-white';
    } else if (tab === 'Categorias') {
        if (viewCategorias) viewCategorias.classList.remove('hidden');
        if (tabCategorias) tabCategorias.className = 'px-4 py-2 rounded-lg bg-brand-600 text-white';
    } else if (tab === 'MonteSeu') {
        if (viewMonteSeu) viewMonteSeu.classList.remove('hidden');
        if (tabMonteSeu) tabMonteSeu.className = 'px-4 py-2 rounded-lg bg-brand-600 text-white';
    } else if (tab === 'Opcionais') {
        if (viewOpcionais) viewOpcionais.classList.remove('hidden');
        if (tabOpcionais) tabOpcionais.className = 'px-4 py-2 rounded-lg bg-brand-600 text-white';
    } else if (tab === 'Info') {
        if (viewInfo) viewInfo.classList.remove('hidden');
        if (tabInfo) tabInfo.className = 'px-4 py-2 rounded-lg bg-brand-600 text-white';
    } else if (tab === 'Taxas') {
        if (viewTaxas) viewTaxas.classList.remove('hidden');
        if (tabTaxas) {
            tabTaxas.classList.remove('text-neutral-400');
            tabTaxas.classList.add('bg-neutral-800', 'text-white');
        }
    } else if (tab === 'Entregadores') {
        if (viewEntregadores) viewEntregadores.classList.remove('hidden');
        if (tabEntregadores) {
            tabEntregadores.classList.remove('text-neutral-400');
            tabEntregadores.classList.add('bg-neutral-800', 'text-white');
        }
        renderCouriers();
    }
}

tabProdutos.addEventListener('click', () => switchTab('Produtos'));
tabCategorias.addEventListener('click', () => switchTab('Categorias'));
tabMonteSeu.addEventListener('click', () => switchTab('MonteSeu'));
tabOpcionais.addEventListener('click', () => switchTab('Opcionais'));
tabInfo.addEventListener('click', () => switchTab('Info'));
tabTaxas.addEventListener('click', () => switchTab('Taxas'));
tabEntregadores.addEventListener('click', () => switchTab('Entregadores'));

// --- Products Logic ---
function formatProductPrice(product, category) {
    if (category && category.useSizes) {
        const labels = { p: 'P', m: 'M', g: 'G' };
        const parts = [];
        Object.entries(labels).forEach(([key, label]) => {
            const normal = product.prices ? Number(product.prices[key] || 0) : 0;
            if (normal <= 0) return;
            const offer = product.offerPrices ? Number(product.offerPrices[key] || 0) : 0;
            if (offer > 0 && offer < normal) {
                parts.push(`${label}: <span class="text-red-600">${money(offer)}</span> <del class="text-neutral-500">${money(normal)}</del>`);
            } else {
                parts.push(`${label}: ${money(normal)}`);
            }
        });
        return parts.length ? parts.join('<br>') : '-';
    }

    const normalPrice = Number(product.price || 0);
    const offerPriceValue = Number(product.offerPrice || 0);
    if (offerPriceValue > 0 && offerPriceValue < normalPrice) {
        return `<span class="text-red-600">${money(offerPriceValue)}</span> <del class="text-neutral-500">${money(normalPrice)}</del>`;
    }
    return normalPrice > 0 ? money(normalPrice) : '-';
}

function renderProductFilters() {
    if (!productFilterButtons) return;
    const categories = Array.isArray(DB.categories) ? DB.categories : [];
    const validIds = new Set(categories.map(cat => cat.id));
    if (productFilterCategory && !validIds.has(productFilterCategory)) {
        productFilterCategory = '';
    }

    productFilterButtons.innerHTML = '';

    const createButton = (label, value) => {
        const button = document.createElement('button');
        button.type = 'button';
        const isActive = productFilterCategory === value;
        const baseClass = 'px-3 py-1 rounded-lg text-sm transition-colors border';
        button.className = `${baseClass} ${isActive ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100'}`;
        button.textContent = label;
        button.addEventListener('click', () => {
            if (productFilterCategory === value) return;
            productFilterCategory = value;
            renderProductFilters();
            renderProducts();
        });
        return button;
    };

    productFilterButtons.appendChild(createButton('Todos', ''));
    categories.forEach(cat => {
        productFilterButtons.appendChild(createButton(cat.name, cat.id));
    });
}

function handleCategoryChange() {
    const category = DB.categories.find(cat => cat.id === pCategory.value);
    const useSizes = category ? !!category.useSizes : false;
    boxPricesSimple.classList.toggle('hidden', useSizes);
    boxPricesSimpleOffer.classList.toggle('hidden', useSizes);
    boxPricesSizes.classList.toggle('hidden', !useSizes);
    boxPricesSizesOffer.classList.toggle('hidden', !useSizes);

    if (pOptionGroup) {
        const product = editingProductId ? DB.products.find(p => p.id === editingProductId) : null;
        const preferred = product?.optionGroupId ?? (category?.optionGroupId ?? '');
        const availableValues = Array.from(pOptionGroup.options).map(opt => opt.value);
        pOptionGroup.value = availableValues.includes(preferred) ? preferred : '';
    }
}

pCategory.addEventListener('change', handleCategoryChange);


if (productSearch) {
    productSearch.addEventListener('input', event => {
        productSearchTerm = event.target.value;
        renderProducts();
    });
}

if (pFileInput) {
    pFileInput.addEventListener('change', (e) => {
        showCustomAlert('Upload via Firebase desativado. Por favor, cole a URL da imagem diretamente no campo acima.');
        pFileInput.value = '';
    });
}

function populateCategorySelect() {
    const current = pCategory.value;
    pCategory.innerHTML = '<option value="">Selecione...</option>';
    DB.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        pCategory.appendChild(option);
    });
    if (current && DB.categories.some(cat => cat.id === current)) {
        pCategory.value = current;
    }
    handleCategoryChange();
}

function clearProductForm() {
    editingProductId = null;
    pName.value = '';
    pDescription.value = '';
    pCategory.value = '';
    if (pOptionGroup) pOptionGroup.value = '';
    pImage.value = '';
    pPrice.value = '';
    pOfferPrice.value = '';
    pPriceP.value = '';
    pPriceM.value = '';
    pPriceG.value = '';
    pOfferPriceP.value = '';
    pOfferPriceM.value = '';
    pOfferPriceG.value = '';
    pAvailable.checked = true;
    pAvailable.checked = true;
    if (pFileInput) pFileInput.value = '';
    if (pUploadStatus) pUploadStatus.textContent = '';
    btnSaveProduct.textContent = 'Adicionar';
    handleCategoryChange();
}

async function saveProduct(event) {
    event.preventDefault();
    const name = pName.value.trim();
    const categoryId = pCategory.value;
    if (!name) {
        showCustomAlert('Informe o nome do produto.');
        return;
    }
    if (!categoryId) {
        showCustomAlert('Selecione a categoria.');
        return;
    }
    const category = DB.categories.find(cat => cat.id === categoryId);
    if (!category) {
        showCustomAlert('Categoria inválida.');
        return;
    }

    const payload = {
        id: editingProductId || generateId('prod'),
        name,
        description: pDescription.value.trim(),
        categoryId,
        imageUrl: pImage.value.trim(),
        available: pAvailable.checked,
        optionGroupId: pOptionGroup.value || null
    };

    if (category.useSizes) {
        const prices = sanitizeSizePrices({
            p: pPriceP.value,
            m: pPriceM.value,
            g: pPriceG.value
        });
        const offerPrices = sanitizeSizePrices({
            p: pOfferPriceP.value,
            m: pOfferPriceM.value,
            g: pOfferPriceG.value
        });
        if (!prices) {
            showCustomAlert('Informe ao menos um preço de tamanho.');
            return;
        }
        payload.prices = prices;
        payload.offerPrices = offerPrices;
        payload.price = undefined;
        payload.offerPrice = undefined;
    } else {
        const price = Number(pPrice.value || 0);
        if (price <= 0) {
            showCustomAlert('Informe o preço do produto.');
            return;
        }
        const offerPrice = Number(pOfferPrice.value || 0);
        payload.price = price;
        payload.offerPrice = offerPrice > 0 && offerPrice < price ? offerPrice : undefined;
        payload.prices = undefined;
        payload.offerPrices = undefined;
    }

    try {
        if (editingProductId) {
            const index = DB.products.findIndex(product => product.id === editingProductId);
            if (index > -1) {
                DB.products[index] = { ...DB.products[index], ...payload };
            }
        } else {
            DB.products.push(payload);
        }

        await persistDB();
        renderProducts();
        clearProductForm();
    } catch (error) {
        // persistDB already displayed alert
    }
}

btnSaveProduct.addEventListener('click', saveProduct);

window.productActions = {
    editProduct: function (id) {
        const product = DB.products.find(p => p.id === id);
        if (!product) return;

        editingProductId = id;
        pName.value = product.name;
        pDescription.value = product.description || '';
        pCategory.value = product.categoryId;
        pImage.value = product.imageUrl || '';
        pAvailable.checked = product.available !== false;
        handleCategoryChange();

        if (pOptionGroup) {
            const values = Array.from(pOptionGroup.options).map(opt => opt.value);
            const desired = product.optionGroupId || '';
            pOptionGroup.value = values.includes(desired) ? desired : '';
        }

        const category = DB.categories.find(cat => cat.id === product.categoryId);
        if (category && category.useSizes) {
            pPriceP.value = product.prices?.p ?? '';
            pPriceM.value = product.prices?.m ?? '';
            pPriceG.value = product.prices?.g ?? '';
            pOfferPriceP.value = product.offerPrices?.p ?? '';
            pOfferPriceM.value = product.offerPrices?.m ?? '';
            pOfferPriceG.value = product.offerPrices?.g ?? '';
            pPrice.value = '';
            pOfferPrice.value = '';
        } else {
            pPrice.value = product.price ?? '';
            pOfferPrice.value = product.offerPrice ?? '';
            pPriceP.value = '';
            pPriceM.value = '';
            pPriceG.value = '';
            pOfferPriceP.value = '';
        }

        btnSaveProduct.textContent = 'Salvar alterações';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    deleteProduct: async function (id) {
        const product = DB.products.find(p => p.id === id);
        if (!product) return;
        if (!await showCustomConfirm('Excluir este produto?')) return;
        DB.products = DB.products.filter(p => p.id !== id);
        if (editingProductId === id) {
            clearProductForm();
        }
        try {
            await persistDB();
            renderProducts();
        } catch (error) {
            // error handled
        }
    }
};

function renderProducts() {
    if (!gridProducts) return;
    gridProducts.innerHTML = '';

    const normalizedSearch = productSearchTerm.trim().toLowerCase();
    const filteredProducts = (Array.isArray(DB.products) ? DB.products : []).filter(product => {
        if (productFilterCategory && product.categoryId !== productFilterCategory) {
            return false;
        }
        if (normalizedSearch) {
            const name = (product.name || '').toLowerCase();
            const description = (product.description || '').toLowerCase();
            return name.includes(normalizedSearch) || description.includes(normalizedSearch);
        }
        return true;
    });

    if (!filteredProducts.length) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td class="p-4 text-center text-neutral-500" colspan="7">Nenhum produto encontrado.</td>`;
        gridProducts.appendChild(emptyRow);
        return;
    }

    filteredProducts.forEach(product => {
        const category = DB.categories.find(cat => cat.id === product.categoryId);
        const description = (product.description || '').trim();
        const tr = document.createElement('tr');
        tr.className = 'border-t';
        tr.innerHTML = `
            <td class="p-3">${product.name}</td>
            <td class="p-3 text-neutral-500 text-xs">${description || '-'}</td>
            <td class="p-3">${category ? category.name : '-'}</td>
            <td class="p-3">${product.imageUrl ? `<a href="${escapeAttr(product.imageUrl)}" class="text-brand-600 underline" target="_blank">Abrir</a>` : '-'}</td>
            <td class="p-3">${formatProductPrice(product, category)}</td>
            <td class="p-3">${product.available === false ? 'Sim' : 'Não'}</td>
            <td class="p-3 text-right space-x-2">
                <button class="px-3 py-1 rounded-lg border hover:bg-neutral-100" data-edit="${product.id}">Editar</button>
                <button class="px-3 py-1 rounded-lg border hover:bg-red-100 text-red-600" data-delete="${product.id}">Excluir</button>
            </td>
        `;
        gridProducts.appendChild(tr);
    });

    gridProducts.querySelectorAll('[data-edit]').forEach(btn => {
        btn.addEventListener('click', () => window.productActions.editProduct(btn.getAttribute('data-edit')));
    });
    gridProducts.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', () => window.productActions.deleteProduct(btn.getAttribute('data-delete')));
    });
}

// --- Categories Logic ---
function handleCategorySizeToggle() {
    const usesSizes = cUseSizes.checked;
    cAllowHalfWrapper.classList.toggle('hidden', !usesSizes);
    if (!usesSizes) {
        cAllowHalf.checked = false;
    }
}

cUseSizes.addEventListener('change', handleCategorySizeToggle);

function clearCategoryForm() {
    editingCategoryId = null;
    cName.value = '';
    cUseSizes.checked = false;
    cAllowHalf.checked = false;
    cOptionGroup.value = '';
    btnSaveCategory.textContent = 'Adicionar';
    handleCategorySizeToggle();
}

async function saveCategory(event) {
    event.preventDefault();
    const name = cName.value.trim();
    if (!name) {
        showCustomAlert('Informe o nome da categoria.');
        return;
    }
    const useSizes = cUseSizes.checked;
    const payload = {
        id: editingCategoryId || generateId('cat'),
        name,
        useSizes,
        optionGroupId: cOptionGroup.value || null,
        allowHalf: useSizes ? cAllowHalf.checked : false
    };

    try {
        if (editingCategoryId) {
            const index = DB.categories.findIndex(cat => cat.id === editingCategoryId);
            if (index > -1) {
                DB.categories[index] = { ...DB.categories[index], ...payload };
            }
        } else {
            DB.categories.push(payload);
        }

        await persistDB();
        renderCategories();
        populateOptionGroupSelects();
        populateCategorySelect();
        renderProductFilters();
        renderProducts();
        clearCategoryForm();
    } catch (error) {
        // handled
    }
}

btnSaveCategory.addEventListener('click', saveCategory);

window.categoryActions = {
    editCategory: function (id) {
        const category = DB.categories.find(cat => cat.id === id);
        if (!category) return;
        editingCategoryId = id;
        cName.value = category.name;
        cUseSizes.checked = !!category.useSizes;
        cOptionGroup.value = category.optionGroupId || '';
        cAllowHalf.checked = !!category.allowHalf;
        handleCategorySizeToggle();
        btnSaveCategory.textContent = 'Salvar alterações';
        switchTab('categorias');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    deleteCategory: async function (id) {
        const category = DB.categories.find(cat => cat.id === id);
        if (!category) return;
        let confirmationMessage = 'Excluir esta categoria?';
        const hasProducts = DB.products.some(product => product.categoryId === id);
        if (hasProducts) {
            confirmationMessage = 'Esta categoria possui produtos cadastrados. Excluir categoria e remover os produtos relacionados?';
        }
        if (!await showCustomConfirm(confirmationMessage)) return;
        DB.categories = DB.categories.filter(cat => cat.id !== id);
        if (hasProducts) {
            DB.products = DB.products.filter(product => product.categoryId !== id);
        }
        if (editingCategoryId === id) {
            clearCategoryForm();
        }
        try {
            await persistDB();
            renderCategories();
            populateOptionGroupSelects();
            populateCategorySelect();
            renderProductFilters();
            renderProducts();
        } catch (error) {
            // handled
        }
    }
};

function renderCategories() {
    gridCategories.innerHTML = '';
    DB.categories.forEach(cat => {
        const optionGroup = DB.optionGroups.find(group => group.id === cat.optionGroupId);
        const tr = document.createElement('tr');
        tr.className = 'border-t';
        tr.innerHTML = `
            <td class="p-3">${cat.name}</td>
            <td class="p-3">${cat.useSizes ? 'Sim' : 'Não'}</td>
            <td class="p-3">${optionGroup ? optionGroup.name : '-'}</td>
            <td class="p-3">${cat.useSizes && cat.allowHalf ? 'Sim' : 'Não'}</td>
            <td class="p-3 text-right space-x-2">
                <button class="px-3 py-1 rounded-lg border hover:bg-neutral-100" data-edit-cat="${cat.id}">Editar</button>
                <button class="px-3 py-1 rounded-lg border hover:bg-red-100 text-red-600" data-del-cat="${cat.id}">Excluir</button>
            </td>
        `;
        gridCategories.appendChild(tr);
    });

    gridCategories.querySelectorAll('[data-edit-cat]').forEach(btn => {
        btn.addEventListener('click', () => window.categoryActions.editCategory(btn.getAttribute('data-edit-cat')));
    });
    gridCategories.querySelectorAll('[data-del-cat]').forEach(btn => {
        btn.addEventListener('click', () => window.categoryActions.deleteCategory(btn.getAttribute('data-del-cat')));
    });
}

// --- Fees Logic ---
function renderBaseFee() {
    tBase.value = DB.fees.base ?? 0;
}

btnSaveBase.addEventListener('click', async event => {
    event.preventDefault();
    DB.fees.base = Number(tBase.value || 0);
    try {
        await persistDB();
        showCustomAlert('Taxa base atualizada!');
    } catch (error) {
        // handled
    }
});

function clearSitioForm() {
    editingSitioId = null;
    sName.value = '';
    sFee.value = '';
    btnSaveSitio.textContent = 'Adicionar Sítio';
}

async function saveSitio(event) {
    event.preventDefault();
    const name = sName.value.trim();
    const fee = Number(sFee.value || 0);
    if (!name) {
        showCustomAlert('Informe o nome do sítio.');
        return;
    }
    if (fee <= 0) {
        showCustomAlert('Informe a taxa do sítio.');
        return;
    }

    try {
        if (editingSitioId) {
            const index = DB.fees.sitios.findIndex(site => site.id === editingSitioId);
            if (index > -1) {
                DB.fees.sitios[index] = { ...DB.fees.sitios[index], name, fee };
            }
        } else {
            DB.fees.sitios.push({ id: generateId('sitio'), name, fee });
        }

        await persistDB();
        renderSitios();
        clearSitioForm();
    } catch (error) {
        // handled
    }
}

btnSaveSitio.addEventListener('click', saveSitio);

window.sitioActions = {
    editSitio: function (id) {
        const site = DB.fees.sitios.find(s => s.id === id);
        if (!site) return;
        editingSitioId = id;
        sName.value = site.name;
        sFee.value = site.fee;
        btnSaveSitio.textContent = 'Salvar alterações';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    deleteSitio: async function (id) {
        if (!await showCustomConfirm('Excluir este sítio?')) return;
        DB.fees.sitios = DB.fees.sitios.filter(site => site.id !== id);
        if (editingSitioId === id) {
            clearSitioForm();
        }
        try {
            await persistDB();
            renderSitios();
        } catch (error) {
            // handled
        }
    }
};

function renderSitios() {
    gridSitios.innerHTML = '';
    DB.fees.sitios.forEach(site => {
        const tr = document.createElement('tr');
        tr.className = 'border-t';
        tr.innerHTML = `
            <td class="p-3">${site.name}</td>
            <td class="p-3">${money(site.fee)}</td>
            <td class="p-3 text-right space-x-2">
                <button class="px-3 py-1 rounded-lg border hover:bg-neutral-100" data-edit-site="${site.id}">Editar</button>
                <button class="px-3 py-1 rounded-lg border hover:bg-red-100 text-red-600" data-del-site="${site.id}">Excluir</button>
            </td>
        `;
        gridSitios.appendChild(tr);
    });

    gridSitios.querySelectorAll('[data-edit-site]').forEach(btn => {
        btn.addEventListener('click', () => window.sitioActions.editSitio(btn.getAttribute('data-edit-site')));
    });
    gridSitios.querySelectorAll('[data-del-site]').forEach(btn => {
        btn.addEventListener('click', () => window.sitioActions.deleteSitio(btn.getAttribute('data-del-site')));
    });
}

// --- Monte Seu Logic ---
msType.addEventListener('change', () => {
    const isBase = msType.value === 'base';
    msBoxBasePrice.classList.toggle('hidden', !isBase);
    msBoxSizes.classList.toggle('hidden', isBase);
});

function addSizeInput(name = '', price = '') {
    const div = document.createElement('div');
    div.className = 'flex items-center gap-2 ms-size-row';
    div.innerHTML = `
        <input type="text" class="w-full border rounded-lg px-3 py-2 ms-size-name" placeholder="Nome (Ex: 500ml)" value="${escapeAttr(name)}">
        <input type="number" step="0.01" class="w-48 border rounded-lg px-3 py-2 ms-size-price" placeholder="Preço" value="${escapeAttr(price)}">
        <button type="button" class="px-3 py-1 text-red-600 hover:bg-red-100 rounded-lg">X</button>
    `;
    div.querySelector('button').addEventListener('click', () => div.remove());
    msSizesContainer.appendChild(div);
}

msBtnAddSize.addEventListener('click', event => {
    event.preventDefault();
    addSizeInput();
});

function addAddonInput(name = '', price = '') {
    const div = document.createElement('div');
    div.className = 'flex items-center gap-2 ms-addon-row';
    div.innerHTML = `
        <input type="text" class="w-full border rounded-lg px-3 py-2 ms-addon-name" placeholder="Nome (Ex: Bacon)" value="${escapeAttr(name)}">
        <input type="number" step="0.01" class="w-48 border rounded-lg px-3 py-2 ms-addon-price" placeholder="Preço" value="${escapeAttr(price)}">
        <button type="button" class="px-3 py-1 text-red-600 hover:bg-red-100 rounded-lg">X</button>
    `;
    div.querySelector('button').addEventListener('click', () => div.remove());
    msAddonsContainer.appendChild(div);
}

msBtnAddAddon.addEventListener('click', event => {
    event.preventDefault();
    addAddonInput();
});

function clearMonteSeuForm() {
    editingMonteSeuId = null;
    msName.value = '';
    msType.value = 'base';
    msBasePrice.value = '';
    msSizesContainer.innerHTML = '';
    msAddonsContainer.innerHTML = '';
    btnSaveMonteSeu.textContent = 'Adicionar';
    msType.dispatchEvent(new Event('change'));
}

async function saveMonteSeu(event) {
    event.preventDefault();
    const name = msName.value.trim();
    if (!name) {
        showCustomAlert('Informe o nome da categoria.');
        return;
    }
    const type = msType.value;

    const data = { name, type, addons: [] };
    if (type === 'base') {
        const basePrice = Number(msBasePrice.value || 0);
        if (basePrice <= 0) {
            showCustomAlert('Informe o preço base.');
            return;
        }
        data.basePrice = basePrice;
        data.sizes = undefined;
    } else {
        const sizes = [];
        msSizesContainer.querySelectorAll('.ms-size-row').forEach(row => {
            const sizeName = row.querySelector('.ms-size-name').value.trim();
            const sizePrice = Number(row.querySelector('.ms-size-price').value || 0);
            if (sizeName && sizePrice > 0) {
                sizes.push({ name: sizeName, price: sizePrice });
            }
        });
        if (!sizes.length) {
            showCustomAlert('Adicione ao menos um tamanho.');
            return;
        }
        data.sizes = sizes;
        data.basePrice = undefined;
    }

    const addons = [];
    msAddonsContainer.querySelectorAll('.ms-addon-row').forEach(row => {
        const addonName = row.querySelector('.ms-addon-name').value.trim();
        const addonPrice = Number(row.querySelector('.ms-addon-price').value || 0);
        if (addonName) {
            addons.push({ name: addonName, price: addonPrice > 0 ? addonPrice : 0 });
        }
    });
    data.addons = addons;

    try {
        if (editingMonteSeuId) {
            const index = DB.monteSeu.findIndex(item => item.id === editingMonteSeuId);
            if (index > -1) {
                DB.monteSeu[index] = { ...DB.monteSeu[index], ...data };
            }
        } else {
            data.id = generateId('ms');
            DB.monteSeu.push(data);
        }

        await persistDB();
        renderMonteSeu();
        clearMonteSeuForm();
    } catch (error) {
        // handled
    }
}

btnSaveMonteSeu.addEventListener('click', saveMonteSeu);

window.monteSeuActions = {
    editMonteSeu: function (id) {
        const item = DB.monteSeu.find(ms => ms.id === id);
        if (!item) return;
        clearMonteSeuForm();
        editingMonteSeuId = id;
        msName.value = item.name;
        msType.value = item.type;
        msBasePrice.value = item.basePrice ?? '';
        (item.sizes || []).forEach(size => addSizeInput(size.name, size.price));
        (item.addons || []).forEach(addon => addAddonInput(addon.name, addon.price));
        btnSaveMonteSeu.textContent = 'Salvar alterações';
        msType.dispatchEvent(new Event('change'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    deleteMonteSeu: async function (id) {
        if (!await showCustomConfirm('Excluir esta categoria Monte o Seu?')) return;
        DB.monteSeu = DB.monteSeu.filter(item => item.id !== id);
        if (editingMonteSeuId === id) {
            clearMonteSeuForm();
        }
        try {
            await persistDB();
            renderMonteSeu();
        } catch (error) {
            // handled
        }
    }
};

function renderMonteSeu() {
    gridMonteSeu.innerHTML = '';
    DB.monteSeu.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'border-t';
        tr.innerHTML = `
            <td class="p-3">${item.name}</td>
            <td class="p-3">${item.type === 'base' ? 'Preço base' : 'Tamanhos'}</td>
            <td class="p-3 text-right space-x-2">
                <button class="px-3 py-1 rounded-lg border hover:bg-neutral-100" data-edit-ms="${item.id}">Editar</button>
                <button class="px-3 py-1 rounded-lg border hover:bg-red-100 text-red-600" data-del-ms="${item.id}">Excluir</button>
            </td>
        `;
        gridMonteSeu.appendChild(tr);
    });

    gridMonteSeu.querySelectorAll('[data-edit-ms]').forEach(btn => {
        btn.addEventListener('click', () => window.monteSeuActions.editMonteSeu(btn.getAttribute('data-edit-ms')));
    });
    gridMonteSeu.querySelectorAll('[data-del-ms]').forEach(btn => {
        btn.addEventListener('click', () => window.monteSeuActions.deleteMonteSeu(btn.getAttribute('data-del-ms')));
    });
}

// --- Option Group Logic ---
function addOptionGroupInput(name = '', price = '') {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 og-option-row';
    row.innerHTML = `
        <input type="text" class="w-full border rounded-lg px-3 py-2 og-option-name" placeholder="Nome (Ex: Cheddar)" value="${escapeAttr(name)}">
        <input type="number" step="0.01" class="w-40 border rounded-lg px-3 py-2 og-option-price" placeholder="Preço" value="${escapeAttr(price)}">
        <button type="button" class="px-3 py-1 text-red-600 hover:bg-red-100 rounded-lg">X</button>
    `;
    row.querySelector('button').addEventListener('click', () => row.remove());
    ogOptionsContainer.appendChild(row);
}

ogBtnAddOption.addEventListener('click', event => {
    event.preventDefault();
    addOptionGroupInput();
});

function clearOptionGroupForm() {
    editingOptionGroupId = null;
    ogName.value = '';
    ogLabel.value = '';
    ogOptionsContainer.innerHTML = '';
    btnSaveOptionGroup.textContent = 'Adicionar';
    addOptionGroupInput();
}

function serializeOptionGroupForm() {
    const name = ogName.value.trim();
    if (!name) {
        showCustomAlert('Informe o nome do grupo.');
        return null;
    }
    const label = ogLabel.value.trim();
    const options = [];
    ogOptionsContainer.querySelectorAll('.og-option-row').forEach(row => {
        const optionName = row.querySelector('.og-option-name').value.trim();
        const optionPrice = Number(row.querySelector('.og-option-price').value || 0);
        if (optionName) {
            options.push({ name: optionName, price: optionPrice });
        }
    });
    if (!options.length) {
        showCustomAlert('Adicione ao menos uma opção.');
        return null;
    }
    return { name, label, options };
}

btnSaveOptionGroup.addEventListener('click', async event => {
    event.preventDefault();
    const data = serializeOptionGroupForm();
    if (!data) return;

    try {
        if (editingOptionGroupId) {
            const index = DB.optionGroups.findIndex(group => group.id === editingOptionGroupId);
            if (index > -1) {
                DB.optionGroups[index] = { ...DB.optionGroups[index], ...data };
            }
        } else {
            DB.optionGroups.push({ id: generateId('opt'), ...data });
        }

        await persistDB();
        renderOptionGroups();
        populateOptionGroupSelects();
        renderCategories();
        renderProductFilters();
        renderProducts();
        clearOptionGroupForm();
    } catch (error) {
        // handled
    }
});

window.optionGroupActions = {
    editOptionGroup: function (id) {
        const group = DB.optionGroups.find(g => g.id === id);
        if (!group) return;
        editingOptionGroupId = id;
        ogName.value = group.name;
        ogLabel.value = group.label || '';
        ogOptionsContainer.innerHTML = '';
        (group.options || []).forEach(opt => addOptionGroupInput(opt.name, opt.price));
        if (!ogOptionsContainer.children.length) addOptionGroupInput();
        btnSaveOptionGroup.textContent = 'Salvar alterações';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    deleteOptionGroup: async function (id) {
        if (!await showCustomConfirm('Excluir este grupo de opcionais?')) return;
        DB.optionGroups = DB.optionGroups.filter(group => group.id !== id);
        DB.categories.forEach(cat => {
            if (cat.optionGroupId === id) cat.optionGroupId = null;
        });
        DB.products.forEach(prod => {
            if (prod.optionGroupId === id) prod.optionGroupId = null;
        });
        if (editingOptionGroupId === id) {
            clearOptionGroupForm();
        }
        try {
            await persistDB();
            renderOptionGroups();
            populateOptionGroupSelects();
            renderCategories();
            renderProductFilters();
            renderProducts();
        } catch (error) {
            // handled
        }
    }
};

function renderOptionGroups() {
    gridOptionGroups.innerHTML = '';
    if (!DB.optionGroups.length) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="p-3 text-center text-neutral-500" colspan="4">Nenhum grupo cadastrado.</td>`;
        gridOptionGroups.appendChild(tr);
        return;
    }
    DB.optionGroups.forEach(group => {
        const tr = document.createElement('tr');
        tr.className = 'border-t';
        const resumo = (group.options || []).map(opt => `${escapeAttr(opt.name)} (${money(Number(opt.price || 0))})`).join(', ');
        tr.innerHTML = `
            <td class="p-3">${escapeAttr(group.name)}</td>
            <td class="p-3">${group.label ? escapeAttr(group.label) : '-'}</td>
            <td class="p-3">${resumo || '-'}</td>
            <td class="p-3 text-right space-x-2">
                <button class="px-3 py-1 rounded-lg border hover:bg-neutral-100" data-edit-opt="${group.id}">Editar</button>
                <button class="px-3 py-1 rounded-lg border hover:bg-red-100 text-red-600" data-del-opt="${group.id}">Excluir</button>
            </td>
        `;
        gridOptionGroups.appendChild(tr);
    });

    gridOptionGroups.querySelectorAll('[data-edit-opt]').forEach(btn => {
        btn.addEventListener('click', () => window.optionGroupActions.editOptionGroup(btn.getAttribute('data-edit-opt')));
    });
    gridOptionGroups.querySelectorAll('[data-del-opt]').forEach(btn => {
        btn.addEventListener('click', () => window.optionGroupActions.deleteOptionGroup(btn.getAttribute('data-del-opt')));
    });
}

function populateOptionGroupSelects() {
    const optionsHtml = ['<option value="">Nenhum</option>'];
    DB.optionGroups.forEach(group => {
        optionsHtml.push(`<option value="${escapeAttr(group.id)}">${escapeAttr(group.name)}</option>`);
    });
    [pOptionGroup, cOptionGroup].forEach(select => {
        if (!select) return;
        const current = select.value;
        select.innerHTML = optionsHtml.join('');
        const availableValues = Array.from(select.options).map(opt => opt.value);
        if (availableValues.includes(current)) {
            select.value = current;
        }
    });
}

// --- Info Logic ---
btnSaveInfo.addEventListener('click', async event => {
    event.preventDefault();
    DB.info = {
        description: infoDescription.value.trim(),
        address: infoAddress.value.trim(),
        whatsapp: infoWhatsapp.value.trim(),
        instagram: infoInstagram.value.trim(),
        open: infoOpen.checked,
        footerMessage: (document.getElementById('infoFooterMessage')?.value || '').trim()
    };
    try {
        await persistDB();
        showCustomAlert('Informações atualizadas com sucesso!');
    } catch (error) {
        // handled
    }
});

// --- General Render Logic ---
function renderAll({ resetForms = false } = {}) {
    if (resetForms) {
        productFilterCategory = '';
        productSearchTerm = '';
    }
    if (productSearch) {
        productSearch.value = productSearchTerm;
    }

    populateOptionGroupSelects();
    populateCategorySelect();
    renderCategories();
    renderProductFilters();
    renderProducts();
    renderBaseFee();
    renderSitios();
    renderMonteSeu();
    renderOptionGroups();
    if (DB.info) {
        infoDescription.value = DB.info.description || '';
        infoAddress.value = DB.info.address || '';
        infoWhatsapp.value = DB.info.whatsapp || '';
        infoInstagram.value = DB.info.instagram || '';
        infoOpen.checked = !!DB.info.open;

        const infoFooterMessage = document.getElementById('infoFooterMessage');
        if (infoFooterMessage) {
            infoFooterMessage.value = DB.info.footerMessage || '';
        }
    }
    if (resetForms) {
        clearProductForm();
        clearCategoryForm();
        clearSitioForm();
        clearMonteSeuForm();
        clearOptionGroupForm();
    }
    handleCategorySizeToggle();
    if (!hasInitializedUI) {
        switchTab('Produtos');
        hasInitializedUI = true;
    }
}

async function bootstrapAdmin() {
    if (authSubmit) authSubmit.disabled = true;
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/data.json`, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const content = decodeURIComponent(escape(atob(data.content)));
            DB = normalizeDB(JSON.parse(content));
            
            if (authScreen) authScreen.classList.add('hidden');
            if (logoutBtn) logoutBtn.classList.remove('hidden');
            hasInitializedUI = true;
            renderAll({ resetForms: true });
        } else {
            throw new Error('Token inválido ou sem acesso.');
        }
    } catch (e) {
        console.error(e);
        localStorage.removeItem('lamundo_gh_token');
        githubToken = null;
        if (authScreen) authScreen.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (authError) {
            authError.textContent = 'Token inválido ou sem permissão.';
            authError.classList.remove('hidden');
        }
    } finally {
        if (authSubmit) authSubmit.disabled = false;
    }
}

if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (authError) authError.classList.add('hidden');
        githubToken = authPassword.value.trim();
        localStorage.setItem('lamundo_gh_token', githubToken);
        if (authSubmit) authSubmit.textContent = 'Verificando...';
        await bootstrapAdmin();
        if (authSubmit) authSubmit.textContent = 'Acessar Painel';
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('lamundo_gh_token');
        location.reload();
    });
}

// Initial check
if (githubToken) {
    bootstrapAdmin();
} else {
    if (authScreen) authScreen.classList.remove('hidden');
    // Fetch public data just to have it in memory, though UI is blocked
    fetchDB().then(data => { DB = data; });
}

/* KDS Logic - Appended to admin.js */

// DOM Elements - KDS
// tabCozinha defined at top
// viewCozinha defined at top
// const btnToggleSound = document.getElementById('btnToggleSound');




// --- Couriers Logic ---

// State for editing courier
let editingCourierIndex = null;

function renderCouriers() {
    if (!DB.info || !DB.info.couriers) {
        if (gridCouriers) gridCouriers.innerHTML = '<p class="text-neutral-500 col-span-full">Nenhum entregador cadastrado.</p>';
        return;
    }

    if (gridCouriers) {
        gridCouriers.innerHTML = DB.info.couriers.map((c, index) => `
            <div class="bg-neutral-800 rounded-lg p-4 flex justify-between items-center border border-neutral-700">
                <div>
                    <h3 class="font-bold text-white">${c.name}</h3>
                    <p class="text-sm text-neutral-400"><i class="fa-brands fa-whatsapp mr-1"></i>${c.phone}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="editCourier(${index})" class="text-blue-500 hover:text-blue-400 p-2"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="removeCourier(${index})" class="text-red-500 hover:text-red-400 p-2"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    }
}

window.editCourier = (index) => {
    if (!DB.info || !DB.info.couriers) return;
    const courier = DB.info.couriers[index];
    if (!courier) return;

    courierName.value = courier.name;
    courierPhone.value = courier.phone;
    editingCourierIndex = index;

    if (btnAddCourier) {
        btnAddCourier.innerHTML = '<i class="fa-solid fa-check mr-2"></i> Atualizar';
        btnAddCourier.className = 'bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg px-4 py-3 transition-colors';
    }
    courierName.focus();
};

window.removeCourier = async (index) => {
    if (!await showCustomConfirm('Remover entregador?')) return;
    if (!DB.info || !DB.info.couriers) return;

    const couriers = DB.info.couriers;
    couriers.splice(index, 1);
    DB.info.couriers = couriers;

    await persistDB();
    renderCouriers();

    if (editingCourierIndex === index) resetCourierForm();
    showToast('Entregador removido!');
};

function resetCourierForm() {
    courierName.value = '';
    courierPhone.value = '';
    editingCourierIndex = null;
    if (btnAddCourier) {
        btnAddCourier.innerHTML = '<i class="fa-solid fa-plus mr-2"></i> Adicionar';
        btnAddCourier.className = 'bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg px-4 py-3 transition-colors';
    }
}

if (btnAddCourier) {
    btnAddCourier.addEventListener('click', async () => {
        const name = courierName.value.trim();
        const phone = courierPhone.value.trim();
        if (!name || !phone) { showCustomAlert('Preencha nome e WhatsApp.'); return; }

        if (!DB.info) DB.info = {};
        if (!DB.info.couriers) DB.info.couriers = [];

        if (editingCourierIndex !== null) {
            // Update
            DB.info.couriers[editingCourierIndex] = { name, phone };
            await persistDB();
            showToast('Entregador atualizado!');
            resetCourierForm();
        } else {
            // Create
            DB.info.couriers.push({ name, phone });
            await persistDB();

            courierName.value = '';
            courierPhone.value = '';
            showToast('Entregador adicionado!');
        }
        renderCouriers();
    });
}

// --- Dispatch Logic ---
window.openDispatchModal = (orderId) => {
    currentDispatchOrderId = orderId;
    if (dispatchOrderId) dispatchOrderId.textContent = `#${orderId.slice(0, 4)}`;

    // Populate Modal List
    if (dispatchList) {
        if (!DB.info || !DB.info.couriers || DB.info.couriers.length === 0) {
            dispatchList.innerHTML = '<p class="text-neutral-500 text-center">Nenhum entregador cadastrado. Vá em "Entregadores" primeiro.</p>';
        } else {
            dispatchList.innerHTML = DB.info.couriers.map((c, idx) => `
                <button onclick="selectCourierForDispatch(${idx})" class="w-full text-left p-3 rounded hover:bg-neutral-800 flex justify-between items-center border border-neutral-700 mb-2 group">
                    <div>
                        <div class="font-bold text-white">${c.name}</div>
                        <div class="text-xs text-neutral-500">${c.phone}</div>
                    </div>
                    <i class="fa-solid fa-paper-plane text-neutral-500 group-hover:text-brand-500"></i>
                </button>
            `).join('');
        }
    }

    if (dispatchModal) dispatchModal.classList.remove('hidden');
};

window.closeDispatchModal = () => {
    if (dispatchModal) dispatchModal.classList.add('hidden');
    currentDispatchOrderId = null;
};

window.selectCourierForDispatch = async (courierIndex) => {
    const courier = DB.info.couriers[courierIndex];
    if (!courier || !currentDispatchOrderId) return;

    try {
        const docRef = doc(ORDERS_COL, currentDispatchOrderId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) { showCustomAlert('Pedido não encontrado.'); return; }
        const order = { id: snap.id, ...snap.data() };

        // Construct Message
        let mapLink = '';
        if (order.customer.location && order.customer.location.link) {
            mapLink = `📍 *Localização:* ${order.customer.location.link}\n`;
        } else if (order.customer.address) {
            mapLink = `📍 *Endereço:* ${order.customer.address} (${order.customer.reference || ''})\n`;
        }

        const itemsList = order.items.map(i => `- ${i.qty}x ${i.name}`).join('\n');

        const msg = `*Pedido #${order.id.slice(0, 4)}* para ${order.customer.name}\n\n${itemsList}\n\n${mapLink}\nO cliente aguarda! 🛵💨`;

        const whatsappUrl = `https://wa.me/55${courier.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;

        window.open(whatsappUrl, '_blank');
        closeDispatchModal();

    } catch (e) {
        console.error(e);
        showCustomAlert('Erro ao gerar despacho.');
    }
};

// Toast Helper
function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-neutral-800 text-white px-4 py-2 rounded shadow border border-neutral-700 animate-fade-in z-50';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
