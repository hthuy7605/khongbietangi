import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';

const categoryOptions = [
    { label: 'Street Food', value: 'Street Food' },
    { label: 'Cafe', value: 'Cafe' },
    { label: 'Restaurant', value: 'Restaurant' },
    { label: 'Fast Food', value: 'Fast Food' },
    { label: 'Dessert', value: 'Dessert' },
    { label: 'Khác', value: 'Khác' }
];

export default function DishForm({ visible, onHide, onSubmit, initialData }) {
    const [district, setDistrict] = useState('');
    const [address, setAddress] = useState('');
    const [category, setCategory] = useState(null);
    const [priority, setPriority] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const isEditing = !!initialData;

    useEffect(() => {
        if (visible) {
            if (initialData) {
                setDistrict(initialData.district || '');
                setAddress(initialData.address || '');
                setCategory(initialData.category || null);
                setPriority(initialData.priority || 0);
            } else {
                setDistrict('');
                setAddress('');
                setCategory(null);
                setPriority(0);
            }
            setErrors({});
        }
    }, [visible, initialData]);

    const validate = () => {
        const newErrors = {};
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            await onSubmit({
                district: district.trim(),
                address: address.trim(),
                category: category || '',
                priority: priority || 0
            });
            onHide();
        } catch (err) {
            setErrors({ submit: err.message || 'Có lỗi xảy ra' });
        } finally {
            setSubmitting(false);
        }
    };

    const footer = (
        <div className="flex gap-2 justify-end">
            <Button
                label="Hủy"
                icon="pi pi-times"
                outlined
                onClick={onHide}
                disabled={submitting}
            />
            <Button
                label={isEditing ? 'Cập nhật' : 'Thêm'}
                icon="pi pi-check"
                onClick={handleSubmit}
                loading={submitting}
                severity="success"
            />
        </div>
    );

    return (
        <Dialog
            header={isEditing ? '✏️ Sửa món ăn' : '➕ Thêm món ăn'}
            visible={visible}
            onHide={onHide}
            footer={footer}
            className="w-[90vw] max-w-lg"
            draggable={false}
            resizable={false}
        >
            <div className="flex flex-col gap-4 py-2">
                {/* District */}
                <div className="flex flex-col gap-1">
                    <label htmlFor="district" className="text-sm font-medium text-slate-700">
                        Quận
                    </label>
                    <InputText
                        id="district"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="VD: District 1"
                    />
                </div>

                {/* Address */}
                <div className="flex flex-col gap-1">
                    <label htmlFor="address" className="text-sm font-medium text-slate-700">
                        Địa chỉ
                    </label>
                    <InputTextarea
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="VD: 123 Nguyen Hue"
                        rows={3}
                    />
                </div>

                {/* Category */}
                <div className="flex flex-col gap-1">
                    <label htmlFor="category" className="text-sm font-medium text-slate-700">
                        Phân loại
                    </label>
                    <Dropdown
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.value)}
                        options={categoryOptions}
                        placeholder="Chọn phân loại"
                        showClear
                    />
                </div>

                {/* Priority */}
                <div className="flex flex-col gap-1">
                    <label htmlFor="priority" className="text-sm font-medium text-slate-700">
                        Ưu tiên
                    </label>
                    <InputNumber
                        id="priority"
                        value={priority}
                        onValueChange={(e) => setPriority(e.value)}
                        min={0}
                        max={10}
                        showButtons
                        className="w-full"
                    />
                </div>

                {errors.submit && (
                    <small className="text-red-500 text-center">{errors.submit}</small>
                )}
            </div>
        </Dialog>
    );
}
