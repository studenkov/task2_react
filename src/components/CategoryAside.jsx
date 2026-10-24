import { useState } from 'react';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { createCategory } from '@/api/categories';
import { Plus } from '@untitledui/icons';

export function CategoryAside({
  categories = [],
  selectedCategories = [],
  onChange,
  onCategoryCreated,
  isAdmin = false,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = (id) => {
    if (selectedCategories.includes(id)) {
      onChange(selectedCategories.filter((catId) => catId !== id));
    } else {
      onChange([...selectedCategories, id]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const created = await createCategory({ name: newCategoryName.trim() });
      if (onCategoryCreated) {
        onCategoryCreated(created);
      }
      setNewCategoryName('');
      setIsAdding(false);
    } catch (err) {
      setError(err.message || 'Ошибка создания категории');
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-full md:w-64 shrink-0 rounded-xl border border-secondary bg-primary p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between pb-4 border-b border-secondary">
        <div>
          <h3 className="text-sm font-semibold text-primary">Категории</h3>
          <p className="text-xs text-tertiary mt-0.5">Фильтрация каталога</p>
        </div>

        {selectedCategories.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-semibold text-fg-brand-primary hover:opacity-80 transition cursor-pointer">
            Сбросить
          </button>
        )}
      </div>

      <div className="pt-4 flex flex-col gap-3">
        {categories.map((category) => (
          <Checkbox
            key={category.id}
            isSelected={selectedCategories.includes(category.id)}
            onChange={() => handleToggle(category.id)}
            label={category.name}>
            {category.name}
          </Checkbox>
        ))}
      </div>

      {isAdmin && (
        <div className="mt-6 pt-4 border-t border-secondary">
          {!isAdding ?
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-secondary bg-primary hover:bg-secondary border border-secondary rounded-lg shadow-xs transition cursor-pointer">
              {Plus}
              Добавить категорию
            </button>
          : <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                autoFocus
                disabled={loading}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Например, SOHO"
                className="w-full px-3 py-1.5 text-xs bg-primary border border-secondary rounded-lg shadow-xs text-primary placeholder:text-placeholder focus:outline-none focus:border-brand focus:ring-4 focus:ring-focus-ring/20 transition"
              />

              {error && (
                <p className="text-[11px] text-text-error-primary">{error}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading || !newCategoryName.trim()}
                  className="flex-1 py-1.5 px-3 text-xs font-semibold text-white bg-brand-solid hover:bg-brand-solid_hover disabled:opacity-50 rounded-lg shadow-xs transition cursor-pointer">
                  {loading ? 'Создание...' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setError(null);
                  }}
                  className="py-1.5 px-3 text-xs font-semibold text-secondary hover:bg-secondary rounded-lg transition cursor-pointer">
                  Отмена
                </button>
              </div>
            </form>
          }
        </div>
      )}
    </aside>
  );
}
