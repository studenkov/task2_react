import { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AuthContext } from '@/context/AuthContext';
import { Table, TableCard } from '@/components/application/table/table';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { useDelayedLoading } from '@/hooks/use-delayed-loading';
import {
  Trash01,
  Edit01,
  SearchLg,
  XClose,
  CheckCircle,
  AlertCircle,
} from '@untitledui/icons';

const TABLES = [
  { key: 'products', title: 'Товары' },
  { key: 'categories', title: 'Категории' },
  { key: 'users', title: 'Пользователи' },
  { key: 'roles', title: 'Роли' },
  { key: 'coupons', title: 'Купоны' },
  { key: 'orders', title: 'Заказы' },
  { key: 'order_items', title: 'Позиции заказов' },
  { key: 'payments', title: 'Платежи' },
  { key: 'cart_items', title: 'Корзины' },
];

const TABLE_COLUMNS = {
  products: [
    'id',
    'category_id',
    'name',
    'brand',
    'wifi_standard',
    'ports_speed',
    'price',
    'discount_percent',
    'stock_quantity',
    'image_url',
    'description',
  ],
  categories: ['id', 'name'],
  users: [
    'id',
    'full_name',
    'email',
    'password',
    'role',
    'role_id',
    'coupon_id',
    'coupon_code',
    'coupon_discount',
  ],
  roles: ['id', 'name'],
  coupons: ['id', 'code', 'discount_percent', 'description'],
  orders: [
    'id',
    'user_id',
    'order_date',
    'status',
    'total_price',
    'delivery_address',
  ],
  order_items: ['id', 'order_id', 'product_id', 'quantity', 'unit_price'],
  payments: [
    'id',
    'order_id',
    'amount',
    'payment_date',
    'payment_method',
    'status',
  ],
  cart_items: ['id', 'user_id', 'product_id', 'quantity'],
};

export default function AdminPage() {
  const { session, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTable = useMemo(() => {
    const fromUrl = searchParams.get('tab');
    if (fromUrl && TABLES.some((t) => t.key === fromUrl)) {
      return fromUrl;
    }
    const fromStorage = localStorage.getItem('admin_active_table');
    if (fromStorage && TABLES.some((t) => t.key === fromStorage)) {
      return fromStorage;
    }
    return 'products';
  }, [searchParams]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const [couponsList, setCouponsList] = useState([]);
  const [rolesList, setRolesList] = useState([]);

  const showSpinner = useDelayedLoading(loading, 300);

  const triggerRefresh = useCallback(() => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!session?.token || session?.role !== 'admin') return;

    let ignore = false;

    fetch('http://localhost:3001/api/admin/tables/coupons', {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!ignore && Array.isArray(data)) setCouponsList(data);
      })
      .catch(() => {});

    fetch('http://localhost:3001/api/admin/tables/roles', {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!ignore && Array.isArray(data)) setRolesList(data);
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [session?.token, session?.role]);

  useEffect(() => {
    if (!session?.id || session?.role !== 'admin') {
      return;
    }

    let ignore = false;

    fetch(
      `http://localhost:3001/api/admin/tables/${activeTable}?admin_id=${session.id}`,
      {
        headers:
          session?.token ? { Authorization: `Bearer ${session.token}` } : {},
      },
    )
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Ошибка загрузки данных');
        }
        return data;
      })
      .then((data) => {
        if (!ignore) {
          setRows(Array.isArray(data) ? data : []);
          setError('');
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeTable, session?.id, session?.role, session?.token, refreshTrigger]);

  const columns = useMemo(() => {
    if (rows.length === 0) {
      return TABLE_COLUMNS[activeTable] || [];
    }
    return Object.keys(rows[0]);
  }, [rows, activeTable]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const query = searchQuery.toLowerCase().trim();
    return rows.filter((row) =>
      Object.values(row).some((val) =>
        val !== null && val !== undefined ?
          String(val).toLowerCase().includes(query)
        : false,
      ),
    );
  }, [rows, searchQuery]);

  const handleSelectTable = (key) => {
    if (key === activeTable) return;
    setLoading(true);
    setRows([]);
    setSearchParams({ tab: key });
    localStorage.setItem('admin_active_table', key);
    setIsAdding(false);
    setEditingId(null);
    setFormData({});
    setSearchQuery('');
    setError('');
    setSuccessMessage('');
  };

  const handleStartAdd = () => {
    if (isAdding && !editingId) {
      setIsAdding(false);
      setFormData({});
    } else {
      setEditingId(null);
      setFormData({});
      setIsAdding(true);
      setError('');
      setSuccessMessage('');
    }
  };

  const handleStartEdit = (row) => {
    setEditingId(row.id);
    const initialData = {};
    columns
      .filter((c) => c !== 'id')
      .forEach((col) => {
        initialData[col] =
          row[col] !== null && row[col] !== undefined ? String(row[col]) : '';
      });
    setFormData(initialData);
    setIsAdding(true);
    setError('');
    setSuccessMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({});
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Вы уверены, что хотите удалить запись #${id}?`))
      return;

    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch(
        `http://localhost:3001/api/admin/tables/${activeTable}/${id}?admin_id=${session.id}`,
        {
          method: 'DELETE',
          headers:
            session?.token ? { Authorization: `Bearer ${session.token}` } : {},
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при удалении');
      }
      setSuccessMessage(`Запись #${id} успешно удалена`);
      triggerRefresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const url =
        editingId ?
          `http://localhost:3001/api/admin/tables/${activeTable}/${editingId}`
        : `http://localhost:3001/api/admin/tables/${activeTable}`;

      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(session?.token ?
            { Authorization: `Bearer ${session.token}` }
          : {}),
        },
        body: JSON.stringify({
          admin_id: session.id,
          data: formData,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(
          resData.error ||
            (editingId ? 'Ошибка при сохранении' : 'Ошибка при добавлении'),
        );
      }

      setSuccessMessage(
        editingId ?
          `Запись #${editingId} успешно обновлена`
        : 'Запись успешно добавлена',
      );
      if (
        editingId === session?.id ||
        Number(formData?.id) === Number(session?.id)
      ) {
        if (refreshUser) refreshUser();
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({});
      triggerRefresh();
    } catch (err) {
      setError(err.message);
    }
  };

  if (session?.role !== 'admin') {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-secondary bg-primary p-8 text-center shadow-xs">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-error-primary text-text-error-primary mb-4">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="text-xl font-bold text-primary">Доступ ограничен</h2>
          <p className="mt-2 text-sm text-tertiary">
            Для просмотра панели администратора требуется войти под учётной
            записью с правами администратора.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Button size="sm" color="secondary" onClick={() => navigate('/')}>
              На главную
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const activeTableMeta = TABLES.find((t) => t.key === activeTable);

  return (
    <section className="mx-auto flex w-full max-w-container flex-col gap-8 py-12 px-8">
      <div className="flex flex-row w-full justify-between gap-4 items-center">
        <div className="prose">
          <h1>База данных магазина</h1>
        </div>
        <Button size="sm" color="primary" onClick={handleStartAdd}>
          {isAdding && !editingId ? 'Скрыть форму' : 'Добавить запись'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-secondary pb-3">
        {TABLES.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleSelectTable(tab.key)}
            className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeTable === tab.key ?
                'bg-fg-brand-primary text-white'
              : 'bg-secondary text-secondary hover:text-primary'
            }`}>
            {tab.title}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-error_subtle bg-error-primary p-3.5 text-xs text-text-error-primary">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="cursor-pointer text-text-error-primary hover:opacity-75">
            <XClose className="size-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-success_subtle bg-success-primary p-3.5 text-xs text-text-success-primary">
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="cursor-pointer text-text-success-primary hover:opacity-75">
            <XClose className="size-4" />
          </button>
        </div>
      )}

      {isAdding && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-secondary bg-primary p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-primary">
              {editingId ?
                `Редактирование записи #${editingId} в «${activeTableMeta?.title}»`
              : `Новая запись в «${activeTableMeta?.title}»`}
            </h3>
            <button
              type="button"
              onClick={handleCancelForm}
              className="cursor-pointer text-tertiary hover:text-primary">
              <XClose className="size-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {columns
              .filter((c) => {
                if (c === 'id') return false;
                if (
                  activeTable === 'users' &&
                  (c === 'role' ||
                    c === 'coupon_code' ||
                    c === 'coupon_discount')
                ) {
                  return false;
                }
                return true;
              })
              .map((col) => {
                if (activeTable === 'users' && col === 'coupon_id') {
                  return (
                    <div key={col} className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-tertiary">
                        Купон (скидка)
                      </label>
                      <select
                        className="h-10 w-full rounded-lg border border-secondary bg-primary px-3 text-xs text-primary focus:outline-none focus:ring-2 focus:ring-fg-brand-primary"
                        value={formData.coupon_id ?? ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            coupon_id: e.target.value,
                          }))
                        }>
                        <option value="">Без купона (0%)</option>
                        {couponsList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code} (-{c.discount_percent}%) — id: {c.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (activeTable === 'users' && col === 'role_id') {
                  return (
                    <div key={col} className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-tertiary">
                        Роль пользователя
                      </label>
                      <select
                        className="h-10 w-full rounded-lg border border-secondary bg-primary px-3 text-xs text-primary focus:outline-none focus:ring-2 focus:ring-fg-brand-primary"
                        value={formData.role_id ?? ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            role_id: e.target.value,
                          }))
                        }>
                        <option value="">Выберите роль</option>
                        {rolesList.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} (id: {r.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                return (
                  <div key={col} className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-tertiary">
                      {col}
                    </label>
                    <Input
                      placeholder={col}
                      value={formData[col] ?? ''}
                      onChange={(val) => {
                        const next =
                          typeof val === 'string' ? val : (
                            (val?.target?.value ?? '')
                          );
                        setFormData((prev) => ({ ...prev, [col]: next }));
                      }}
                    />
                  </div>
                );
              })}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              size="sm"
              color="secondary"
              type="button"
              onClick={handleCancelForm}>
              Отмена
            </Button>
            <Button size="sm" color="primary" type="submit">
              {editingId ? 'Сохранить изменения' : 'Создать'}
            </Button>
          </div>
        </form>
      )}

      <TableCard.Root size="md">
        <TableCard.Header
          title={activeTableMeta?.title || activeTable}
          description={`Таблица: ${activeTable}`}
          badge={
            <span className="rounded-md bg-secondary/50 px-2 py-0.5 text-xs font-semibold text-secondary">
              {loading && rows.length === 0 ?
                showSpinner ?
                  'Загрузка...'
                : ''
              : `Записей: ${filteredRows.length}${searchQuery ? ` (из ${rows.length})` : ''}`
              }
            </span>
          }
          contentTrailing={
            <div className="w-full sm:w-64">
              <Input
                size="sm"
                placeholder="Поиск по таблице..."
                icon={SearchLg}
                value={searchQuery}
                onChange={(val) => {
                  const next =
                    typeof val === 'string' ? val : (val?.target?.value ?? '');
                  setSearchQuery(next);
                }}
              />
            </div>
          }
        />

        {loading && rows.length === 0 ?
          showSpinner ?
            <div className="flex items-center justify-center p-12">
              <LoadingIndicator
                size="md"
                type="line-spinner"
                label="Загрузка данных таблицы"
              />
            </div>
          : <div className="min-h-55" />
        : <div className="overflow-x-auto">
            <Table
              size="md"
              aria-label={`Таблица данных ${activeTableMeta?.title || activeTable}`}>
              <Table.Header bordered>
                {columns.map((col) => (
                  <Table.Head key={col} id={col} label={col} />
                ))}
                <Table.Head id="actions" label="Действия" />
              </Table.Header>
              <Table.Body
                items={filteredRows}
                renderEmptyState={() => (
                  <div className="p-8 text-center text-sm text-tertiary">
                    {loading ?
                      showSpinner ?
                        'Загрузка...'
                      : ''
                    : searchQuery ?
                      'Ничего не найдено по вашему запросу'
                    : 'В этой таблице пока нет записей'}
                  </div>
                )}>
                {(row) => (
                  <Table.Row key={row.id} id={row.id}>
                    {columns.map((col) => {
                      if (activeTable === 'users' && col === 'coupon_code') {
                        return (
                          <Table.Cell key={col} id={`${row.id}-${col}`}>
                            {row.coupon_code ?
                              <span className="inline-flex items-center rounded-md bg-fg-brand-primary/10 px-2 py-0.5 text-xs font-semibold text-fg-brand-primary">
                                {row.coupon_code} (-{row.coupon_discount}%)
                              </span>
                            : <span className="text-xs text-tertiary">—</span>}
                          </Table.Cell>
                        );
                      }

                      if (activeTable === 'users' && col === 'role') {
                        return (
                          <Table.Cell key={col} id={`${row.id}-${col}`}>
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                                row.role === 'admin' ?
                                  'border border-secondary bg-primary font-semibold text-fg-brand-primary'
                                : 'text-primary'
                              }`}>
                              {row.role || '—'}
                            </span>
                          </Table.Cell>
                        );
                      }

                      return (
                        <Table.Cell key={col} id={`${row.id}-${col}`}>
                          <span className="block max-w-55 truncate font-mono text-xs text-primary">
                            {row[col] !== null && row[col] !== undefined ?
                              String(row[col])
                            : '—'}
                          </span>
                        </Table.Cell>
                      );
                    })}
                    <Table.Cell id={`${row.id}-actions`}>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="xs"
                          color="secondary"
                          title="Редактировать запись"
                          onClick={() => handleStartEdit(row)}>
                          <Edit01 className="size-3.5" />
                        </Button>
                        <Button
                          size="xs"
                          color="secondary"
                          title="Удалить запись"
                          className="text-text-error-primary hover:bg-error-primary/20"
                          onClick={() => handleDelete(row.id)}>
                          <Trash01 className="size-3.5" />
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          </div>
        }
      </TableCard.Root>
    </section>
  );
}
