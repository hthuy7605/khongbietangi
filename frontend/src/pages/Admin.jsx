import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { useRef } from 'react';
import { useDishes } from '../context/DishContext';
import { useAuth } from '../context/AuthContext';
import DishForm from '../components/DishForm';

export default function Admin() {
    const { dishes, addDish, editDish, removeDish } = useDishes();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [formVisible, setFormVisible] = useState(false);
    const [editingDish, setEditingDish] = useState(null);
    const toast = useRef(null);

    const handleAdd = () => {
        setEditingDish(null);
        setFormVisible(true);
    };

    const handleEdit = (dish) => {
        setEditingDish(dish);
        setFormVisible(true);
    };

    const handleDelete = (dish) => {
        confirmDialog({
            message: `Bạn có chắc muốn xóa "${dish.district} - ${dish.address}"?`,
            header: 'Xác nhận xóa',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Xóa',
            rejectLabel: 'Hủy',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await removeDish(dish.id);
                    toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa món ăn', life: 3000 });
                } catch (err) {
                    toast.current.show({ severity: 'error', summary: 'Lỗi', detail: err.message || 'Không thể xóa', life: 3000 });
                }
            }
        });
    };

    const handleFormSubmit = async (data) => {
        try {
            if (editingDish) {
                await editDish(editingDish.id, data);
                toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Đã cập nhật món ăn', life: 3000 });
            } else {
                await addDish(data);
                toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Đã thêm món ăn', life: 3000 });
            }
        } catch (err) {
            throw new Error(err.message || 'Không thể lưu món ăn');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const categoryBodyTemplate = (rowData) => {
        if (!rowData.category) return <Tag value="Không phân loại" severity="secondary" />;
        const colorMap = {
            'Street Food': 'warning',
            'Cafe': 'info',
            'Restaurant': 'success',
            'Fast Food': 'danger',
            'Dessert': 'help'
        };
        return <Tag value={rowData.category} severity={colorMap[rowData.category] || 'secondary'} />;
    };

    const priorityBodyTemplate = (rowData) => (
        <div className="flex items-center gap-1">
            <i className="pi pi-star-fill text-amber-400 text-sm"></i>
            <span className="font-semibold">{rowData.priority || 0}</span>
        </div>
    );

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button
                icon="pi pi-pencil"
                rounded
                text
                severity="info"
                tooltip="Sửa"
                tooltipOptions={{ position: 'top' }}
                onClick={() => handleEdit(rowData)}
            />
            <Button
                icon="pi pi-trash"
                rounded
                text
                severity="danger"
                tooltip="Xóa"
                tooltipOptions={{ position: 'top' }}
                onClick={() => handleDelete(rowData)}
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="container mx-auto px-4 py-8 max-w-6xl flex-1">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <Link
                            to="/"
                            className="text-slate-400 hover:text-slate-600 text-sm transition-colors inline-flex items-center gap-1 mb-2"
                        >
                            <i className="pi pi-arrow-left"></i>
                            Về trang chủ
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-800">
                            🍜 Quản lý món ăn
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Thêm, sửa, xóa các món ăn trong danh sách
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            label="Đăng xuất"
                            icon="pi pi-sign-out"
                            severity="secondary"
                            size="large"
                            onClick={handleLogout}
                            className="shadow-lg"
                        />
                        <Button
                            label="Thêm món ăn"
                            icon="pi pi-plus"
                            severity="success"
                            size="large"
                            onClick={handleAdd}
                            className="shadow-lg"
                        />
                    </div>
                </div>

                {/* DataTable */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <DataTable
                        value={dishes}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        stripedRows
                        responsiveLayout="scroll"
                        emptyMessage="Chưa có món ăn nào"
                        className="p-datatable-sm"
                    >
                        <Column field="id" header="ID" style={{ width: '60px' }} className="text-center" />
                        <Column field="district" header="Quận" sortable className="font-medium" />
                        <Column field="address" header="Địa chỉ" sortable />
                        <Column body={categoryBodyTemplate} header="Phân loại" sortable sortField="category" style={{ width: '140px' }} />
                        <Column body={priorityBodyTemplate} header="Ưu tiên" sortable sortField="priority" style={{ width: '100px' }} className="text-center" />
                        <Column body={actionBodyTemplate} header="Thao tác" style={{ width: '100px' }} className="text-center" />
                    </DataTable>
                </div>

                {/* Stats */}
                <div className="mt-6 text-center text-slate-400 text-sm">
                    Tổng cộng: {dishes.length} món ăn
                </div>
            </div>

            {/* Footer */}
            <div className="text-center py-6 text-slate-400 text-sm">
                Được làm ra bởi h.thuy7605@gmail.com
            </div>

            {/* Form Dialog */}
            <DishForm
                visible={formVisible}
                onHide={() => setFormVisible(false)}
                onSubmit={handleFormSubmit}
                initialData={editingDish}
            />
        </div>
    );
}
