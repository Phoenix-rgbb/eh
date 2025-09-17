import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../App';
import Card, { CardHeader, CardTitle, CardSubtitle } from '../components/Card';
import { getMedicinesOffline, saveMedicinesOffline } from '../utils/offlineStorage';
import axios from 'axios';

const Pharmacy = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    fetchMedicines();
    
    const handleOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const fetchMedicines = async () => {
    try {
      if (navigator.onLine) {
        const response = await axios.get('/pharmacy/');
        setMedicines(response.data);
        
        // Cache medicines offline
        await saveMedicinesOffline(response.data);
      } else {
        // Load from offline storage
        const offlineMedicines = await getMedicinesOffline();
        setMedicines(offlineMedicines);
      }
    } catch (error) {
      console.error('Failed to fetch medicines:', error);
      
      // Fallback to offline storage
      try {
        const offlineMedicines = await getMedicinesOffline();
        setMedicines(offlineMedicines);
      } catch (offlineError) {
        console.error('Failed to load offline medicines:', offlineError);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = searchTerm === '' || 
      medicine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
      (filter === 'low-stock' && medicine.stock_quantity <= medicine.minimum_stock_alert) ||
      (filter === 'out-of-stock' && medicine.stock_quantity === 0) ||
      (filter === 'outbreak' && medicine.outbreak_demand_flag);
    
    return matchesSearch && matchesFilter;
  });

  const getStockStatus = (medicine) => {
    if (medicine.stock_quantity === 0) return 'out-of-stock';
    if (medicine.stock_quantity <= medicine.minimum_stock_alert) return 'low-stock';
    return 'normal';
  };

  const getStockColor = (status) => {
    switch (status) {
      case 'out-of-stock': return '#dc3545';
      case 'low-stock': return '#ffc107';
      default: return '#28a745';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1>{t('pharmacy.title')}</h1>
        <p>{t('pharmacy.subtitle')}</p>
        {isOffline && (
          <div className="alert alert-warning">
            You are offline. Showing cached inventory. Stock levels may not be current.
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <Card style={{ marginBottom: '2rem' }}>
        <div className="grid grid-3">
          <div className="form-group">
            <label className="form-label">{t('pharmacy.searchMedicines')}</label>
            <input
              type="text"
              className="form-control"
              placeholder={t('pharmacy.searchMedicines')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Filter</label>
            <select
              className="form-control form-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">{t('pharmacy.categories.all')}</option>
              <option value="low-stock">{t('pharmacy.outOfStock')}</option>
              <option value="out-of-stock">Out of Stock</option>
              <option value="outbreak">Outbreak Demand</option>
            </select>
          </div>
          {user?.role === 'admin' && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'end' }}>
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddForm(true)}
              >
                Add Medicine
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Inventory Summary */}
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="dashboard-widget">
          <div className="widget-header">
            <span className="widget-title">Total Medicines</span>
            <span style={{ fontSize: '1.5rem' }}>💊</span>
          </div>
          <div className="widget-value">{medicines.length}</div>
        </div>
        
        <div className="dashboard-widget">
          <div className="widget-header">
            <span className="widget-title">Low Stock</span>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          </div>
          <div className="widget-value" style={{ color: '#ffc107' }}>
            {medicines.filter(m => m.stock_quantity <= m.minimum_stock_alert && m.stock_quantity > 0).length}
          </div>
        </div>
        
        <div className="dashboard-widget">
          <div className="widget-header">
            <span className="widget-title">Out of Stock</span>
            <span style={{ fontSize: '1.5rem' }}>❌</span>
          </div>
          <div className="widget-value" style={{ color: '#dc3545' }}>
            {medicines.filter(m => m.stock_quantity === 0).length}
          </div>
        </div>
        
        <div className="dashboard-widget">
          <div className="widget-header">
            <span className="widget-title">Outbreak Alert</span>
            <span style={{ fontSize: '1.5rem' }}>🚨</span>
          </div>
          <div className="widget-value" style={{ color: '#dc3545' }}>
            {medicines.filter(m => m.outbreak_demand_flag).length}
          </div>
        </div>
      </div>

      {/* Medicines List */}
      {filteredMedicines.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h3>No Medicines Found</h3>
            <p>No medicines match your search criteria.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-2">
          {filteredMedicines.map((medicine) => {
            const stockStatus = getStockStatus(medicine);
            return (
              <Card key={medicine.id} style={{ marginBottom: '1rem' }}>
                <div className="medicine-item">
                  <div className="medicine-info">
                    <div className="medicine-name">
                      {medicine.name}
                      {medicine.outbreak_demand_flag && (
                        <span className="status status-emergency" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                          OUTBREAK
                        </span>
                      )}
                    </div>
                    <div className="medicine-category">
                      {medicine.category || 'General'} • {medicine.generic_name || 'N/A'}
                    </div>
                    {medicine.price && (
                      <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        ₹{medicine.price} per unit
                      </div>
                    )}
                    {medicine.supplier && (
                      <div style={{ color: '#666', fontSize: '0.8rem' }}>
                        Supplier: {medicine.supplier}
                      </div>
                    )}
                  </div>
                  
                  <div className="stock-info">
                    <div 
                      className="stock-quantity"
                      style={{ color: getStockColor(stockStatus) }}
                    >
                      {medicine.stock_quantity}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      Min: {medicine.minimum_stock_alert}
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      <span className={`status ${stockStatus === 'normal' ? 'status-online' : stockStatus === 'low-stock' ? 'status-busy' : 'status-offline'}`}>
                        {stockStatus === 'out-of-stock' ? 'Out of Stock' :
                         stockStatus === 'low-stock' ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>
                    
                    {user?.role === 'admin' && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <StockUpdateForm medicine={medicine} onUpdate={fetchMedicines} />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Medicine Form */}
      {showAddForm && user?.role === 'admin' && (
        <AddMedicineForm 
          onClose={() => setShowAddForm(false)}
          onAdd={fetchMedicines}
        />
      )}

      {/* Outbreak Alerts */}
      {medicines.some(m => m.outbreak_demand_flag) && (
        <Card style={{ marginTop: '2rem', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <CardHeader>
            <CardTitle style={{ color: '#856404' }}>🚨 Outbreak Demand Alert</CardTitle>
            <CardSubtitle style={{ color: '#856404' }}>
              Extra supplies needed for disease outbreak response
            </CardSubtitle>
          </CardHeader>
          <div>
            <p style={{ color: '#856404', marginBottom: '1rem' }}>
              The following medicines have increased demand due to local disease outbreaks:
            </p>
            <div className="grid grid-3">
              {medicines.filter(m => m.outbreak_demand_flag).map(medicine => (
                <div key={medicine.id} style={{ 
                  padding: '0.75rem', 
                  backgroundColor: 'rgba(255,255,255,0.7)', 
                  borderRadius: '5px',
                  border: '1px solid #ffc107'
                }}>
                  <strong>{medicine.name}</strong>
                  <div style={{ fontSize: '0.9rem' }}>
                    Current: {medicine.stock_quantity} units
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

const StockUpdateForm = ({ medicine, onUpdate }) => {
  const [quantity, setQuantity] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!quantity) return;

    setUpdating(true);
    try {
      await axios.put(`/pharmacy/${medicine.id}/stock`, null, {
        params: { quantity_change: parseInt(quantity) }
      });
      onUpdate();
      setQuantity('');
    } catch (error) {
      console.error('Failed to update stock:', error);
      alert('Failed to update stock');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="+/-"
        style={{ width: '60px', padding: '0.25rem', fontSize: '0.8rem' }}
        disabled={updating}
      />
      <button 
        type="submit" 
        style={{ 
          padding: '0.25rem 0.5rem', 
          fontSize: '0.8rem',
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '3px'
        }}
        disabled={updating || !quantity}
      >
        {updating ? '...' : '✓'}
      </button>
    </form>
  );
};

const AddMedicineForm = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    category: '',
    stock_quantity: 0,
    price: '',
    minimum_stock_alert: 10,
    supplier: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post('/pharmacy/', formData);
      onAdd();
      onClose();
    } catch (error) {
      console.error('Failed to add medicine:', error);
      alert('Failed to add medicine');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Add New Medicine</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Medicine Name *</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Generic Name</label>
            <input
              type="text"
              className="form-control"
              value={formData.generic_name}
              onChange={(e) => setFormData({...formData, generic_name: e.target.value})}
            />
          </div>
          
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-control form-select"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="">Select category</option>
                <option value="Antibiotics">Antibiotics</option>
                <option value="Pain Relief">Pain Relief</option>
                <option value="Fever & Cold">Fever & Cold</option>
                <option value="Digestive">Digestive</option>
                <option value="Vitamins">Vitamins</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Supplier</label>
              <input
                type="text"
                className="form-control"
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
              />
            </div>
          </div>
          
          <div className="grid grid-3">
            <div className="form-group">
              <label className="form-label">Initial Stock</label>
              <input
                type="number"
                className="form-control"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value) || 0})}
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Price (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Min Stock Alert</label>
              <input
                type="number"
                className="form-control"
                value={formData.minimum_stock_alert}
                onChange={(e) => setFormData({...formData, minimum_stock_alert: parseInt(e.target.value) || 10})}
                min="1"
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Medicine'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Pharmacy;
