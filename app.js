(() => {
  'use strict';

  const STORAGE_KEY = 'skillbridge-v1';
  const skills = [
    { name: 'JavaScript', terms: ['javascript', 'js'] }, { name: 'TypeScript', terms: ['typescript', 'ts'] },
    { name: 'React', terms: ['react', 'react.js', 'reactjs'] }, { name: 'Next.js', terms: ['next.js', 'nextjs'] },
    { name: 'Vue', terms: ['vue', 'vue.js', 'vuejs'] }, { name: 'Angular', terms: ['angular'] },
    { name: 'HTML', terms: ['html'] }, { name: 'CSS', terms: ['css', 'scss', 'sass'] },
    { name: 'Node.js', terms: ['node.js', 'nodejs'] }, { name: 'Python', terms: ['python'] },
    { name: 'Java', terms: ['java'] }, { name: 'C#', terms: ['c#', 'c sharp'] }, { name: 'C++', terms: ['c++'] },
    { name: 'Go', terms: ['golang', ' go '] }, { name: 'PHP', terms: ['php'] }, { name: 'Ruby', terms: ['ruby'] },
    { name: 'SQL', terms: ['sql'] }, { name: 'PostgreSQL', terms: ['postgresql', 'postgres'] },
    { name: 'MySQL', terms: ['mysql'] }, { name: 'MongoDB', terms: ['mongodb', 'mongo db'] },
    { name: 'REST API', terms: ['rest api', 'restful'] }, { name: 'GraphQL', terms: ['graphql'] },
    { name: 'Git', terms: ['git', 'github', 'gitlab'] }, { name: 'Docker', terms: ['docker'] },
    { name: 'Kubernetes', terms: ['kubernetes', 'k8s'] }, { name: 'AWS', terms: ['aws', 'amazon web services'] },
    { name: 'Azure', terms: ['azure'] }, { name: 'Google Cloud', terms: ['google cloud', 'gcp'] },
    { name: 'CI/CD', terms: ['ci/cd', 'continuous integration', 'continuous delivery'] },
    { name: 'Linux', terms: ['linux'] }, { name: 'Figma', terms: ['figma'] },
    { name: 'UI/UX', terms: ['ui/ux', 'ux/ui', 'user experience', 'user interface', 'ux design'] },
    { name: 'Прототипування', terms: ['prototyping', 'прототипуван'] }, { name: 'Дизайн-системи', terms: ['design system', 'дизайн-систем'] },
    { name: 'Дослідження користувачів', terms: ['user research', 'дослідження користувачів', 'usability testing'] },
    { name: 'Аналітика', terms: ['analytics', 'аналітик', 'data analysis', 'аналітика'] },
    { name: 'Machine Learning', terms: ['machine learning', 'машинне навчання', ' ml '] },
    { name: 'Data Science', terms: ['data science', 'наука про дані'] }, { name: 'Excel', terms: ['excel', 'spreadsheets'] },
    { name: 'Power BI', terms: ['power bi'] }, { name: 'Tableau', terms: ['tableau'] },
    { name: 'A/B-тестування', terms: ['a/b testing', 'ab testing', 'a/b-тест', 'a/b test'] },
    { name: 'Agile', terms: ['agile', 'scrum', 'kanban'] }, { name: 'Управління проєктами', terms: ['project management', 'управління проєкт'] },
    { name: 'Комунікація', terms: ['communication', 'комунікац'] }, { name: 'Англійська', terms: ['english', 'англійськ'] },
    { name: 'Лідерство', terms: ['leadership', 'лідерств'] }, { name: 'SEO', terms: ['seo'] },
    { name: 'Маркетинг', terms: ['marketing', 'маркетинг'] }, { name: 'Контент', terms: ['content strategy', 'контент-стратег', 'copywriting'] },
    { name: 'Продажі', terms: ['sales', 'продаж'] }, { name: 'CRM', terms: ['crm', 'salesforce', 'hubspot'] },
    { name: 'Бухгалтерський облік', terms: ['accounting', 'бухгалтер'] }, { name: 'Фінансове моделювання', terms: ['financial modeling', 'фінансове моделювання'] },
    { name: 'Тестування', terms: ['testing', 'qa', 'тестування'] }, { name: 'Jest', terms: ['jest'] },
    { name: 'Cypress', terms: ['cypress'] }, { name: 'Playwright', terms: ['playwright'] },
    { name: 'Swift', terms: ['swift'] }, { name: 'Kotlin', terms: ['kotlin'] }, { name: 'Flutter', terms: ['flutter'] },
    { name: 'iOS', terms: ['ios'] }, { name: 'Android', terms: ['android'] },
  ];

  const byId = id => document.getElementById(id);
  const fields = { resume: byId('resumeText'), job: byId('jobText'), title: byId('jobTitle') };
  let currentAnalysis = null;
  let saved = [];
  let roadmapChecks = {};
  let toastTimer;

  function readState() {
    try {
      const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      fields.resume.value = state.resume || '';
      fields.job.value = state.job || '';
      fields.title.value = state.title || '';
      saved = Array.isArray(state.saved) ? state.saved : [];
      roadmapChecks = state.roadmapChecks || {};
    } catch { /* Ignore malformed local data and keep the app usable. */ }
    renderSaved();
    updateCounts();
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ resume: fields.resume.value, job: fields.job.value, title: fields.title.value, saved, roadmapChecks }));
    } catch { showToast('Браузер не зміг зберегти дані.'); }
  }

  function normalize(text) {
    return ` ${String(text).toLocaleLowerCase('uk').replace(/[’']/g, '').replace(/[^\p{L}\p{N}+#./-]+/gu, ' ')} `;
  }

  function containsTerm(text, term) {
    const haystack = normalize(text);
    const needle = normalize(term);
    if (/^[a-z0-9+#. /-]+$/i.test(term) && term.length > 1) return haystack.includes(needle);
    return haystack.includes(needle);
  }

  function analyze() {
    const resume = fields.resume.value.trim();
    const job = fields.job.value.trim();
    const error = byId('errorMessage');
    error.classList.remove('visible');
    if (resume.length < 25) return showError('Додай трохи більше тексту про себе в резюме (щонайменше 25 символів).');
    if (job.length < 25) return showError('Додай опис вакансії (щонайменше 25 символів), щоб я міг знайти потрібні навички.');

    const requirements = skills.filter(skill => skill.terms.some(term => containsTerm(job, term)));
    if (!requirements.length) return showError('У цьому описі не знайшлося навичок зі словника. Спробуй додати технології, інструменти або професійні вимоги текстом.');
    const matched = requirements.filter(skill => skill.terms.some(term => containsTerm(resume, term)));
    const missing = requirements.filter(skill => !matched.includes(skill));
    const score = Math.round((matched.length / requirements.length) * 100);
    currentAnalysis = { title: fields.title.value.trim() || inferTitle(job), score, matched: matched.map(x => x.name), missing: missing.map(x => x.name), requirements: requirements.map(x => x.name), job };
    roadmapChecks = {};
    renderResults(currentAnalysis);
    renderRoadmap(currentAnalysis);
    persist();
    byId('results').classList.remove('hidden');
    byId('roadmap').classList.remove('hidden');
    byId('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showError(message) { const node = byId('errorMessage'); node.textContent = message; node.classList.add('visible'); }

  function inferTitle(text) {
    const firstLine = text.split(/\n/).map(x => x.trim()).find(Boolean) || 'Обрана вакансія';
    return firstLine.length > 40 ? `${firstLine.slice(0, 37)}…` : firstLine;
  }

  function renderResults(result) {
    byId('resultJobTitle').textContent = result.title;
    byId('scoreValue').textContent = `${result.score}%`;
    byId('scoreRing').style.background = `conic-gradient(#8ca86e ${result.score * 3.6}deg, #e9ede4 0deg)`;
    byId('matchedCount').textContent = result.matched.length;
    byId('missingCount').textContent = result.missing.length;
    byId('skillSummary').textContent = `${result.requirements.length} ${plural(result.requirements.length, 'навичка', 'навички', 'навичок')}`;
    const levels = result.score >= 75
      ? ['Сильна відповідність', 'У тебе вже є більшість навичок із вакансії. Підкресли їх прикладами результатів у резюме.']
      : result.score >= 40
        ? ['Хороша основа для старту', 'Частина потрібних навичок уже є. Зосередься на кількох прогалинах нижче.']
        : ['Твій шлях починається тут', 'Це орієнтир для розвитку. Почни з найважливішої навички й рухайся крок за кроком.'];
    byId('scoreHeadline').textContent = levels[0];
    byId('scoreDescription').textContent = levels[1];
    byId('matchedSkills').innerHTML = result.matched.length ? result.matched.map(name => `<span class="skill-chip">${escapeHtml(name)}</span>`).join('') : '<span class="empty-hint">Поки не знайшов збігів — перевір формулювання резюме.</span>';
    byId('missingSkills').innerHTML = result.missing.length ? result.missing.map(name => `<span class="skill-chip missing">${escapeHtml(name)}</span>`).join('') : '<span class="empty-hint">Чудово! Усі навички з опису вакансії вже згадані.</span>';
    byId('saveBtn').textContent = saved.some(item => item.title === result.title && item.job === result.job) ? '✓ Уже збережено' : '♡ Зберегти вакансію';
  }

  function renderRoadmap(result) {
    const targets = result.missing.slice(0, 6);
    const list = byId('roadmapList');
    if (!targets.length) {
      list.innerHTML = '<div class="roadmap-item"><div class="step-number">✓</div><div><h3>Усі навички вже є у твоєму резюме</h3><p>Наступний крок — підкріпити їх конкретними прикладами та результатами.</p></div><span></span></div>';
      return;
    }
    list.innerHTML = targets.map((skill, index) => {
      const key = `${result.title}|${skill}`;
      const tasks = makeTask(skill);
      return `<article class="roadmap-item ${roadmapChecks[key] ? 'done' : ''}"><div class="step-number">${String(index + 1).padStart(2, '0')}</div><div><h3>Розвивай навичку: ${escapeHtml(skill)}</h3><p>${escapeHtml(tasks)}</p></div><label><input type="checkbox" data-roadmap-key="${escapeHtml(key)}" ${roadmapChecks[key] ? 'checked' : ''}> Готово</label></article>`;
    }).join('');
    list.querySelectorAll('input[type="checkbox"]').forEach(input => input.addEventListener('change', () => {
      roadmapChecks[input.dataset.roadmapKey] = input.checked;
      input.closest('.roadmap-item').classList.toggle('done', input.checked);
      persist();
    }));
  }

  function makeTask(skill) {
    const projects = {
      React: 'Створи невеликий застосунок і опиши, які компоненти та стан використав.',
      TypeScript: 'Переведи невеликий JavaScript-проєкт на TypeScript і додай типи.',
      JavaScript: 'Закріпи основу на практичних задачах та реалізуй маленьку функцію для портфоліо.',
      Figma: 'Відтвори один екран інтерфейсу та збережи його як кейс у портфоліо.',
      SQL: 'Попрактикуй SELECT, JOIN і групування на відкритому навчальному наборі даних.',
      Python: 'Зроби маленький скрипт або проєкт, що розв’язує реальну задачу.',
      English: 'Виділи регулярний час на професійну лексику й практику розмови.',
    };
    return projects[skill] || `Обери короткий практичний курс з теми «${skill}», виконай невелике завдання та додай результат у портфоліо.`;
  }

  function saveCurrent() {
    if (!currentAnalysis) return showToast('Спочатку проаналізуй вакансію.');
    const exists = saved.some(item => item.title === currentAnalysis.title && item.job === currentAnalysis.job);
    if (!exists) saved.unshift({ ...currentAnalysis, date: new Date().toISOString() });
    persist(); renderSaved();
    byId('saveBtn').textContent = '✓ Уже збережено';
    showToast(exists ? 'Ця вакансія вже у твоїй колекції.' : 'Вакансію збережено у твоїй колекції.');
  }

  function renderSaved() {
    byId('savedCount').textContent = `${saved.length} ${plural(saved.length, 'вакансія', 'вакансії', 'вакансій')}`;
    byId('savedEmpty').classList.toggle('hidden', saved.length > 0);
    byId('savedList').innerHTML = saved.map((item, index) => `<article class="saved-item"><div class="saved-item-icon">⌕</div><div class="saved-item-info"><strong>${escapeHtml(item.title)}</strong><span>Збережено ${formatDate(item.date)} · ${item.matched.length} навичок із вакансії</span></div><span class="saved-score">${item.score}% збіг</span><button class="remove-saved" data-remove="${index}" title="Видалити" aria-label="Видалити ${escapeHtml(item.title)}">×</button></article>`).join('');
    byId('savedList').querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
      saved.splice(Number(button.dataset.remove), 1); persist(); renderSaved();
      if (currentAnalysis) renderResults(currentAnalysis);
    }));
  }

  function formatDate(value) {
    if (!value) return 'щойно';
    return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'short' }).format(new Date(value));
  }

  function plural(n, one, few, many) {
    const mod10 = n % 10, mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function showToast(message) {
    const toast = byId('toast'); toast.textContent = message; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function updateCounts() {
    byId('resumeCount').textContent = `${fields.resume.value.length} символів`;
    byId('jobCount').textContent = `${fields.job.value.length} символів`;
  }

  const sampleJob = `Product Designer\nШукаємо Product Designer, який допоможе створювати зрозумілі цифрові продукти.\n\nЩо потрібно: досвід у UI/UX та Figma, прототипування, дизайн-системи, дослідження користувачів і usability testing. Важливі сильна комунікація, командна робота з розробниками та продуктова аналітика. Досвід роботи в Agile-команді буде перевагою.`;

  byId('analyzeBtn').addEventListener('click', analyze);
  byId('saveBtn').addEventListener('click', saveCurrent);
  [fields.resume, fields.job, fields.title].forEach(field => field.addEventListener('input', () => { updateCounts(); persist(); }));
  byId('sampleBtn').addEventListener('click', () => {
    fields.title.value = 'Product Designer'; fields.job.value = sampleJob;
    if (fields.resume.value.trim().length < 25) fields.resume.value = 'Product designer із досвідом створення інтерфейсів у Figma. Проводжу інтерв’ю з користувачами, створюю прототипи, працюю з дизайн-системами та командою розробки. Використовую UI/UX підхід, комунікацію й Agile.';
    updateCounts(); persist(); showToast('Приклад завантажено — натисни «Проаналізувати відповідність».');
  });

  const fileInput = byId('fileInput'), dropzone = byId('dropzone');
  byId('chooseFile').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) readFile(fileInput.files[0]); });
  ['dragenter', 'dragover'].forEach(type => dropzone.addEventListener(type, event => { event.preventDefault(); dropzone.classList.add('dragging'); }));
  ['dragleave', 'drop'].forEach(type => dropzone.addEventListener(type, event => { event.preventDefault(); dropzone.classList.remove('dragging'); }));
  dropzone.addEventListener('drop', event => { const file = event.dataTransfer.files[0]; if (file) readFile(file); });

  function readFile(file) {
    if (file.size > 5 * 1024 * 1024) return showToast('Файл більший за 5 МБ.');
    if (!/\.(txt|md|csv)$/i.test(file.name)) {
      byId('fileStatus').textContent = 'Для PDF/DOCX скопіюй текст у поле нижче';
      return showToast('Цей MVP читає TXT, MD і CSV. Текст з PDF або DOCX встав у поле вручну.');
    }
    const reader = new FileReader();
    reader.onload = () => { fields.resume.value = String(reader.result || ''); byId('fileStatus').textContent = `Завантажено: ${file.name}`; updateCounts(); persist(); showToast('Текст резюме завантажено.'); };
    reader.onerror = () => showToast('Не вдалося прочитати файл. Спробуй вставити текст вручну.');
    reader.readAsText(file);
  }

  const helpDialog = byId('helpDialog');
  byId('helpBtn').addEventListener('click', () => helpDialog.showModal());
  byId('closeDialog').addEventListener('click', () => helpDialog.close());
  helpDialog.addEventListener('click', event => { if (event.target === helpDialog) helpDialog.close(); });
  byId('resetBtn').addEventListener('click', () => {
    if (!confirm('Очистити збережені локально резюме, вакансії та прогрес?')) return;
    localStorage.removeItem(STORAGE_KEY); saved = []; roadmapChecks = []; currentAnalysis = null;
    fields.resume.value = ''; fields.job.value = ''; fields.title.value = '';
    byId('results').classList.add('hidden'); byId('roadmap').classList.add('hidden');
    byId('fileStatus').textContent = 'Максимальний розмір — 5 МБ'; updateCounts(); renderSaved(); showToast('Локальні дані очищено.');
  });

  readState();
})();
