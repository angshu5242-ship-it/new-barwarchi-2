import { useState, useEffect } from 'react';
import { menuCategories, getMenuCategories } from '../data/menu';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('nb2_menu_categories');
    if (stored) {
      try {
        setCategories(JSON.parse(stored));
      } catch {
        setCategories(getMenuCategories());
      }
    } else {
      setCategories(getMenuCategories());
    }
  }, []);

  const saveToStorage = (cats) => {
    localStorage.setItem('nb2_menu_categories', JSON.stringify(cats));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    const cat = {
      id: newCategory.name.toLowerCase().replace(/\s+/g, '-'),
      name: newCategory.name,
      description: newCategory.description,
      items: [],
    };
    setCategories([...categories, cat]);
    setNewCategory({ name: '', description: '' });
    setShowAddCategory(false);
  };

  const handleDeleteCategory = (id) => {
    if (window.confirm('Delete this category and all its items?')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  const handleAddItem = (catId) => {
    const cat = categories.find(c => c.id === catId);
    const newItem = {
      id: Date.now(),
      name: 'New Item',
      description: '',
      price: '₹0',
      popular: false,
      vegetarian: true,
    };
    setCategories(categories.map(c => 
      c.id === catId ? { ...c, items: [...c.items, newItem] } : c
    ));
  };

  const handleUpdateItem = (catId, itemId, field, value) => {
    setCategories(categories.map(c => 
      c.id === catId 
        ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, [field]: value } : i) }
        : c
    ));
  };

  const handleDeleteItem = (catId, itemId) => {
    setCategories(categories.map(c => 
      c.id === catId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c
    ));
  };

  const handleReorder = (catId, fromIndex, toIndex) => {
    const cat = categories.find(c => c.id === catId);
    const items = [...cat.items];
    const [removed] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, removed);
    setCategories(categories.map(c => c.id === catId ? { ...c, items } : c));
  };

  const exportData = () => {
    const data = JSON.stringify(categories, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'menu-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const resetToDefault = () => {
    if (window.confirm('Reset to default menu? This cannot be undone.')) {
      setCategories(getMenuCategories());
      localStorage.removeItem('nb2_menu_categories');
    }
  };

  const handleSave = () => {
    saveToStorage(categories);
  };

  return (
    <div className="min-h-screen bg-dark-950 text-gray-100 pt-20">
      <div className="section-container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-semibold text-3xl md:text-4xl text-white mb-2">Admin Panel</h1>
            <p className="text-gray-400">Manage your menu categories and items</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={exportData} className="btn-secondary">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Export JSON
            </button>
            <label className="btn-secondary cursor-pointer">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              Import JSON
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
            <button onClick={handleSave} className="btn-primary" disabled={saved}>
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
            <button onClick={resetToDefault} className="btn-outline text-red-400 border-red-400 hover:bg-red-400/10">
              Reset to Default
            </button>
            <button onClick={() => navigate('/')} className="btn-outline">
              View Site
            </button>
          </div>
        </div>

        {saved && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-500/30 rounded-lg text-green-300">
            Changes saved to localStorage! Deploy to Vercel to persist.
          </div>
        )}

        {/* Add Category Form */}
        <div className="mb-8">
          <button 
            onClick={() => setShowAddCategory(!showAddCategory)}
            className="btn-secondary"
          >
            {showAddCategory ? 'Cancel' : '+ Add New Category'}
          </button>
          {showAddCategory && (
            <form onSubmit={handleAddCategory} className="mt-4 p-4 bg-dark-900 rounded-lg border border-dark-700 space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  className="w-full input-field bg-dark-800 border-dark-700 text-white"
                  placeholder="e.g., Starters"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  className="w-full input-field bg-dark-800 border-dark-700 text-white"
                  placeholder="Brief description for customers"
                  rows={2}
                />
              </div>
              <button type="submit" className="btn-primary w-full">Add Category</button>
            </form>
          )}
        </div>

        {/* Categories List */}
        <div className="space-y-6">
          {categories.map((category, catIndex) => (
            <div key={category.id} className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
              {/* Category Header */}
              <div className="p-4 md:p-6 border-b border-dark-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 text-sm">#{catIndex + 1}</span>
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => handleUpdateCategory(category.id, 'name', e.target.value)}
                    className="font-display font-semibold text-xl text-white bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2"
                  />
                  <span className="text-gray-500 text-sm px-2 py-1 bg-dark-800 rounded">ID: {category.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={category.description}
                    onChange={(e) => handleUpdateCategory(category.id, 'description', e.target.value)}
                    className="w-64 md:w-96 input-field bg-dark-800 border-dark-700 text-white text-sm"
                    placeholder="Category description"
                  />
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="btn-outline text-red-400 border-red-400 hover:bg-red-400/10 px-3 py-1.5 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>

              {/* Items */}
              <div className="p-4">
                {category.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No items in this category yet</p>
                    <button onClick={() => handleAddItem(category.id)} className="btn-primary mt-3">+ Add First Item</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {category.items.map((item, itemIndex) => (
                      <div 
                        key={item.id} 
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-dark-950 border border-dark-700 rounded-lg group"
                        style={{ opacity: editingId === item.id ? 1 : 0.9 }}
                      >
                        <span className="text-gray-500 text-sm w-8 flex-shrink-0 text-center cursor-grab active:cursor-grabbing">
                          {itemIndex + 1}
                        </span>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(category.id, item.id, 'name', e.target.value)}
                          className="font-medium text-white bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 flex-1 min-w-0"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(category.id, item.id, 'description', e.target.value)}
                          className="text-gray-400 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 flex-2 min-w-0 text-sm"
                          placeholder="Description"
                        />
                        <input
                          type="text"
                          value={item.price}
                          onChange={(e) => handleUpdateItem(category.id, item.id, 'price', e.target.value)}
                          className="font-semibold text-primary-400 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 w-32 text-center"
                        />
                        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.vegetarian}
                            onChange={(e) => handleUpdateItem(category.id, item.id, 'vegetarian', e.target.checked)}
                            className="w-4 h-4 accent-primary-500 rounded"
                          />
                          Veg
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.popular}
                            onChange={(e) => handleUpdateItem(category.id, item.id, 'popular', e.target.checked)}
                            className="w-4 h-4 accent-primary-500 rounded"
                          />
                          Popular
                        </label>
                        <button
                          onClick={() => handleDeleteItem(category.id, item.id)}
                          className="text-red-400 hover:text-red-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Delete item"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddItem(category.id)}
                      className="w-full mt-3 py-2 text-gray-400 hover:text-primary-400 border border-dashed border-dark-600 rounded-lg transition-colors"
                    >
                      + Add Item
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-xl mb-4">No categories yet</p>
            <button onClick={() => setShowAddCategory(true)} className="btn-primary">Create First Category</button>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminWrapper() {
  const [categories, setCategories] = useState([]);
  // This wrapper handles the state lifting
  return <Admin />;
}

// Helper function for category updates
function handleUpdateCategory(id, field, value) {
  // This will be handled by the parent Admin component's setCategories
}