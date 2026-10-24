import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AuthContext } from '@/context/AuthContext';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { Lock01, Mail01, User01 } from '@untitledui/icons';

export default function RegisterPage() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Введите имя и фамилию';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Введите email';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Некорректный формат email';
    }

    if (!formData.password) {
      newErrors.password = 'Придумайте пароль';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать не менее 6 символов';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Повторите пароль';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, val) => {
    const value = typeof val === 'string' ? val : (val?.target?.value ?? '');
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (serverError) setServerError('');
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setServerError('');
    setIsSubmitting(true);

    try {
      const payload = {
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };

      await register(payload, payload.password, payload.full_name);
      navigate('/login');
    } catch (requestError) {
      if (
        requestError.message.includes('JSON') ||
        requestError.message.includes('Failed to fetch')
      ) {
        setServerError('Сервер недоступен или вернул некорректный ответ');
      } else {
        setServerError(requestError.message || 'Ошибка при регистрации');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-container items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-secondary bg-primary p-6 sm:p-8 shadow-xs transition-colors">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Создать аккаунт
          </h1>
          <p className="mt-2 text-sm text-tertiary">
            Заполните форму для регистрации
          </p>
        </div>

        {serverError && (
          <div className="mb-6 rounded-lg border border-error_subtle bg-error-primary p-3.5 text-xs text-text-error-primary">
            {serverError}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          noValidate>
          <Input
            label="Имя и фамилия"
            placeholder="Иван Иванов"
            icon={User01}
            value={formData.fullName}
            onChange={(val) => handleChange('fullName', val)}
            isInvalid={Boolean(errors.fullName)}
            hint={errors.fullName}
            isRequired
          />

          <Input
            type="email"
            label="Email"
            placeholder="user@example.com"
            icon={Mail01}
            value={formData.email}
            onChange={(val) => handleChange('email', val)}
            isInvalid={Boolean(errors.email)}
            hint={errors.email}
            isRequired
          />

          <Input
            type="password"
            label="Пароль"
            placeholder="Минимум 6 символов"
            icon={Lock01}
            value={formData.password}
            onChange={(val) => handleChange('password', val)}
            isInvalid={Boolean(errors.password)}
            hint={errors.password}
            isRequired
          />

          <Input
            type="password"
            label="Подтвердите пароль"
            placeholder="Минимум 6 символов"
            icon={Lock01}
            value={formData.confirmPassword}
            onChange={(val) => handleChange('confirmPassword', val)}
            isInvalid={Boolean(errors.confirmPassword)}
            hint={errors.confirmPassword}
            isRequired
          />

          <Button
            type="submit"
            size="md"
            color="primary"
            className="mt-2 w-full justify-center"
            isDisabled={isSubmitting}>
            {isSubmitting ? 'Регистрация…' : 'Создать аккаунт'}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-tertiary gap-1 flex justify-center">
          Уже есть аккаунт?{' '}
          <Link
            to="/login"
            className="font-semibold text-fg-brand-primary hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </section>
  );
}
