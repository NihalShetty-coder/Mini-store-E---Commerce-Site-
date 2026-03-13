'use client';

import React, { useState } from 'react';
import { Globe, CheckCircle, Link as LinkIcon, Plus, Trash2, Edit3, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettings, DEFAULT_CONTACTS } from '@/hooks/use-settings';
import { type FooterLink, type ContactMethod } from '@/lib/firestore';

export default function AdminSettingsPage() {
    const { addToast } = useToast();
    const { contactMethods: rawContactMethods, addContactMethod, updateContactMethod, removeContactMethod } = useSettings();
    const contactMethods = rawContactMethods || DEFAULT_CONTACTS;
    const { storeName: globalStoreName, setStoreName: setGlobalStoreName } = useSettings();
    const [storeName, setStoreName] = useState(globalStoreName);
    const [isSaving, setIsSaving] = useState(false);

    const { heroConfig: globalHeroConfig, updateHeroConfig } = useSettings();
    const [heroConfig, setHeroConfig] = useState(globalHeroConfig);

    const { statsConfig: globalStatsConfig, updateStatsConfig } = useSettings();
    const [statsConfig, setStatsConfig] = useState(globalStatsConfig);

    // Contact Methods State
    const [newContactLabel, setNewContactLabel] = useState('');
    const [newContactValue, setNewContactValue] = useState('');
    const [newContactIsLink, setNewContactIsLink] = useState(false);
    const [editingContactId, setEditingContactId] = useState<string | null>(null);

    // Footer Links State
    const { footerLinks, addFooterLink, removeFooterLink, updateFooterLink } = useSettings();
    const [newLinkName, setNewLinkName] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [newLinkSection, setNewLinkSection] = useState('Shop');
    const [isExternal, setIsExternal] = useState(false);
    const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewLinkUrl(reader.result as string);
                addToast('File converted to URL string', 'success');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveLink = () => {
        if (!newLinkName || !newLinkUrl) return;

        if (editingLinkId) {
            updateFooterLink(editingLinkId, { name: newLinkName, url: newLinkUrl, section: newLinkSection, isExternal });
            addToast('Footer link updated', 'success');
        } else {
            addFooterLink({ name: newLinkName, url: newLinkUrl, section: newLinkSection, isExternal });
            addToast('Footer link added', 'success');
        }

        setNewLinkName('');
        setNewLinkUrl('');
        setIsExternal(false);
        setEditingLinkId(null);
    };

    const handleEditClick = (link: FooterLink) => {
        setNewLinkName(link.name);
        setNewLinkUrl(link.url);
        setNewLinkSection(link.section);
        setIsExternal(link.isExternal || false);
        setEditingLinkId(link.id);
        document.getElementById('footer-nav-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSaveContact = () => {
        if (!newContactLabel || !newContactValue) return;

        if (editingContactId) {
            updateContactMethod(editingContactId, { label: newContactLabel, value: newContactValue, isLink: newContactIsLink });
            addToast('Contact method updated', 'success');
        } else {
            addContactMethod({ label: newContactLabel, value: newContactValue, isLink: newContactIsLink });
            addToast('Contact method added', 'success');
        }

        setNewContactLabel('');
        setNewContactValue('');
        setNewContactIsLink(false);
        setEditingContactId(null);
    };

    const handleEditContactClick = (method: ContactMethod) => {
        setNewContactLabel(method.label);
        setNewContactValue(method.value);
        setNewContactIsLink(method.isLink || false);
        setEditingContactId(method.id);
        document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Save to global store
        setGlobalStoreName(storeName);
        updateHeroConfig(heroConfig);
        updateStatsConfig(statsConfig);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        addToast('Global configurations saved successfully.', 'success');
    };

    return (
        <div className="max-w-4xl space-y-12">
            <div>
                <h1 className="font-playfair text-4xl font-black text-secondary">Settings</h1>
                <p className="text-muted-custom text-sm mt-2">Manage global store configurations and integrations.</p>
            </div>

            <section className="bg-white border border-border-custom p-8 space-y-8">
                <div className="flex items-center gap-4 pb-6 border-b border-border-custom">
                    <Globe className="w-5 h-5 text-primary" />
                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary">General Store Info</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-custom">Store Name</label>
                        <input
                            type="text"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            className="w-full bg-surface border border-border-custom px-4 py-4 text-sm outline-none focus:border-primary transition-all"
                        />
                    </div>
                </div>
            </section>

            <section className="bg-white border border-border-custom p-8 space-y-8">
                <div className="flex items-center gap-4 pb-6 border-b border-border-custom">
                    <Globe className="w-5 h-5 text-primary" />
                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary">Homepage Hero</h2>
                </div>
                <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-custom">Hero Title</label>
                        <input
                            type="text"
                            value={heroConfig.title}
                            onChange={(e) => setHeroConfig({ ...heroConfig, title: e.target.value })}
                            className="w-full bg-surface border border-border-custom px-4 py-4 text-sm outline-none focus:border-primary transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-custom">Hero Subtitle</label>
                        <textarea
                            value={heroConfig.subtitle}
                            onChange={(e) => setHeroConfig({ ...heroConfig, subtitle: e.target.value })}
                            className="w-full bg-surface border border-border-custom px-4 py-4 text-sm outline-none focus:border-primary transition-all min-h-[100px]"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-custom">Background Image URL</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={heroConfig.backgroundImage}
                                onChange={(e) => setHeroConfig({ ...heroConfig, backgroundImage: e.target.value })}
                                className="w-full bg-surface border border-border-custom px-4 py-4 text-sm outline-none focus:border-primary transition-all"
                            />
                            <label className="bg-secondary text-white px-6 hover:bg-primary transition-all cursor-pointer flex items-center justify-center shrink-0" title="Upload Image directly as URL">
                                <Upload className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Upload</span>
                                <input 
                                    id="hero-image-upload"
                                    name="heroImage"
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setHeroConfig({ ...heroConfig, backgroundImage: reader.result as string });
                                                addToast('Hero image uploaded', 'success');
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }} 
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white border border-border-custom p-8 space-y-8">
                <div className="flex items-center gap-4 pb-6 border-b border-border-custom">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary">Statistics Banner</h2>
                </div>
                <div className="space-y-4">
                    {statsConfig.map((stat, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-surface p-4 border border-border-custom">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-custom">Label</label>
                                <input
                                    type="text"
                                    value={stat.label}
                                    onChange={(e) => {
                                        const newStats = [...statsConfig];
                                        newStats[index].label = e.target.value;
                                        setStatsConfig(newStats);
                                    }}
                                    className="w-full bg-white border border-border-custom px-4 py-3 text-sm outline-none focus:border-primary transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-custom">Value</label>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        value={stat.value}
                                        onChange={(e) => {
                                            const newStats = [...statsConfig];
                                            newStats[index].value = e.target.value;
                                            setStatsConfig(newStats);
                                        }}
                                        className="w-full bg-white border border-border-custom px-4 py-3 text-sm outline-none focus:border-primary transition-all"
                                    />
                                    <button
                                        onClick={() => {
                                            const newStats = statsConfig.filter((_, i) => i !== index);
                                            setStatsConfig(newStats);
                                        }}
                                        className="p-3 text-muted-custom hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {statsConfig.length < 4 && (
                        <button
                            onClick={() => setStatsConfig([...statsConfig, { label: 'New Stat', value: '0' }])}
                            className="bg-transparent text-secondary border border-border-custom px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:border-secondary transition-all flex items-center justify-center gap-2 w-full md:w-auto mt-4"
                        >
                            <Plus className="w-4 h-4" /> Add Statistic
                        </button>
                    )}
                </div>
            </section>

            <section className="bg-white border border-border-custom p-8 space-y-8">
                <div className="flex items-center gap-4 pb-6 border-b border-border-custom">
                    <Globe className="w-5 h-5 text-primary" />
                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary">Contact & Social Info</h2>
                </div>

                <div className="space-y-6">
                    {/* Add/Edit Contact Form */}
                    <div id="contact-form" className="flex flex-col gap-4 p-6 bg-surface border border-border-custom">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-custom">Label / Platform</label>
                                <input
                                    type="text"
                                    value={newContactLabel}
                                    onChange={(e) => setNewContactLabel(e.target.value)}
                                    placeholder="e.g. Email, Instagram, WhatsApp"
                                    className="w-full bg-white border border-border-custom px-4 py-3 text-sm outline-none focus:border-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-custom">Value / URL</label>
                                <input
                                    type="text"
                                    value={newContactValue}
                                    onChange={(e) => setNewContactValue(e.target.value)}
                                    placeholder="e.g. hello@email.com or https://..."
                                    className="w-full bg-white border border-border-custom px-4 py-3 text-sm outline-none focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2 pt-4 border-t border-border-custom">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="w-4 h-4 border border-border-custom rounded-sm flex items-center justify-center group-hover:border-primary transition-colors bg-white">
                                    {newContactIsLink && <CheckCircle className="w-3 h-3 text-primary" />}
                                </div>
                                <input 
                                    id="contact-is-link"
                                    name="contactIsLink"
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={newContactIsLink} 
                                    onChange={(e) => setNewContactIsLink(e.target.checked)} 
                                />
                                <span className="text-xs text-secondary font-bold select-none">Render as clickable Link (Open in New Tab)</span>
                            </label>

                            <div className="flex gap-2 w-full sm:w-auto">
                                {editingContactId && (
                                    <button
                                        onClick={() => {
                                            setEditingContactId(null);
                                            setNewContactLabel('');
                                            setNewContactValue('');
                                            setNewContactIsLink(false);
                                        }}
                                        className="w-full sm:w-auto bg-transparent text-muted-custom border border-border-custom px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:text-secondary hover:border-secondary transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={handleSaveContact}
                                    className="w-full sm:w-auto bg-secondary text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-2"
                                >
                                    {editingContactId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    {editingContactId ? 'Update Contact' : 'Add Contact'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Current Contact Methods List */}
                    <div className="border border-border-custom divide-y divide-border-custom bg-white">
                        {contactMethods.map((method) => (
                            <div key={method.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 hover:bg-surface/50 transition-colors">
                                <div className="grid grid-cols-3 gap-8 flex-1">
                                    <div className="text-xs font-black uppercase tracking-widest text-primary">{method.label}</div>
                                    <div className="text-sm font-bold text-secondary truncate">{method.value}</div>
                                    <div className="text-xs text-muted-custom">{method.isLink ? 'Link' : 'Text'}</div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => handleEditContactClick(method)}
                                        className="p-2 text-muted-custom hover:text-primary transition-colors"
                                        title="Edit contact method"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            removeContactMethod(method.id);
                                            addToast('Contact method deleted', 'success');
                                        }}
                                        className="p-2 text-muted-custom hover:text-red-500 transition-colors"
                                        title="Delete contact method"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-white border border-border-custom p-8 space-y-8">
                <div className="flex items-center gap-4 pb-6 border-b border-border-custom">
                    <LinkIcon className="w-5 h-5 text-primary" />
                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary">Footer Navigation</h2>
                </div>

                <div className="space-y-6">
                    {/* Add New Link Form */}
                    <div id="footer-nav-form" className="flex flex-col gap-4 p-6 bg-surface border border-border-custom">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-custom">Section</label>
                                <select
                                    value={newLinkSection}
                                    onChange={(e) => setNewLinkSection(e.target.value)}
                                    className="w-full bg-white border border-border-custom px-4 py-3 text-sm outline-none focus:border-primary"
                                >
                                    <option value="Shop">Shop</option>
                                    <option value="Customer Care">Customer Care</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-custom">Link Name</label>
                                <input
                                    type="text"
                                    value={newLinkName}
                                    onChange={(e) => setNewLinkName(e.target.value)}
                                    placeholder="e.g. Careers"
                                    className="w-full bg-white border border-border-custom px-4 py-3 text-sm outline-none focus:border-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-custom">URL or File Upload</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newLinkUrl}
                                        onChange={(e) => setNewLinkUrl(e.target.value)}
                                        placeholder="URL"
                                        className="w-full bg-white border border-border-custom px-4 py-3 text-sm outline-none focus:border-primary"
                                    />
                                    <label className="bg-secondary text-white px-3 py-3 hover:bg-primary transition-all cursor-pointer flex items-center justify-center" title="Upload File directly as URL">
                                        <Upload className="w-4 h-4" />
                                        <input 
                                            id="footer-link-file-upload"
                                            name="footerLinkFile"
                                            type="file" 
                                            className="hidden" 
                                            onChange={handleFileUpload} 
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2 pt-4 border-t border-border-custom">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="w-4 h-4 border border-border-custom rounded-sm flex items-center justify-center group-hover:border-primary transition-colors bg-white">
                                    {isExternal && <CheckCircle className="w-3 h-3 text-primary" />}
                                </div>
                                <input 
                                    id="footer-link-external"
                                    name="footerLinkExternal"
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={isExternal} 
                                    onChange={(e) => setIsExternal(e.target.checked)} 
                                />
                                <span className="text-xs text-secondary font-bold select-none">Open in New Tab</span>
                            </label>

                            <div className="flex gap-2 w-full sm:w-auto">
                                {editingLinkId && (
                                    <button
                                        onClick={() => {
                                            setEditingLinkId(null);
                                            setNewLinkName('');
                                            setNewLinkUrl('');
                                            setIsExternal(false);
                                        }}
                                        className="w-full sm:w-auto bg-transparent text-muted-custom border border-border-custom px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:text-secondary hover:border-secondary transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={handleSaveLink}
                                    className="w-full sm:w-auto bg-secondary text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-2"
                                >
                                    {editingLinkId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    {editingLinkId ? 'Update Link' : 'Add Link'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Current Links List */}
                    <div className="border border-border-custom divide-y divide-border-custom bg-white">
                        {footerLinks.map((link) => (
                            <div key={link.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 hover:bg-surface/50 transition-colors">
                                <div className="grid grid-cols-3 gap-8 flex-1">
                                    <div className="text-xs font-black uppercase tracking-widest text-primary">{link.section}</div>
                                    <div className="text-sm font-bold text-secondary">{link.name}</div>
                                    <div className="text-xs text-muted-custom truncate">{link.url}</div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => handleEditClick(link)}
                                        className="p-2 text-muted-custom hover:text-primary transition-colors"
                                        title="Edit link"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            removeFooterLink(link.id);
                                            addToast('Footer link deleted', 'success');
                                        }}
                                        className="p-2 text-muted-custom hover:text-red-500 transition-colors"
                                        title="Delete link"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-secondary text-white px-12 py-5 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary transition-all disabled:opacity-50"
            >
                {isSaving ? 'SAVING...' : 'Save Global Configuration'}
            </button>
        </div>
    );
}
