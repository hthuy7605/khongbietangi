import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(username, password);
            if (result.success) {
                navigate('/admin');
            } else {
                setError(result.error || 'Đăng nhập thất bại');
            }
        } catch (err) {
            setError('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-50 to-amber-100">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">
                        🔐 Đăng nhập
                    </h1>
                    <p className="text-slate-500">
                        Nhập thông tin để truy cập trang quản lý
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-700 font-medium mb-2">
                            Username
                        </label>
                        <InputText
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Nhập username"
                            className="w-full"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-slate-700 font-medium mb-2">
                            Password
                        </label>
                        <InputText
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nhập password"
                            className="w-full"
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <Message severity="error" text={error} className="w-full" />
                    )}

                    <Button
                        type="submit"
                        label={loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        className="w-full h-12 text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 border-0 shadow-lg hover:shadow-xl transition-all"
                        disabled={loading}
                    >
                        {loading && <ProgressSpinner style={{ width: '20px', height: '20px' }} className="mr-2" />}
                    </Button>
                </form>

                <div className="text-center mt-6">
                    <Link
                        to="/"
                        className="text-slate-500 hover:text-slate-700 text-sm transition-colors inline-flex items-center gap-1"
                    >
                        <i className="pi pi-arrow-left"></i>
                        Quay lại trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
}
