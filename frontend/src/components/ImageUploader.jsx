import { useState, useRef } from 'react';
import { api } from '../services/api';
import { resolveImageUrl } from '../lib/resolveImageUrl';

/**
 * Drag-and-drop image uploader with previews.
 *
 * Props:
 *   images    – array of URL strings (existing images)
 *   onChange  – called with updated array when images change
 *   token     – JWT for upload auth
 */
export default function ImageUploader({ images = [], onChange, token, label = 'Imágenes del Producto' }) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFiles = async (files) => {
        const validFiles = Array.from(files).filter((f) =>
            ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
        );

        if (validFiles.length === 0) {
            setError('Solo se permiten archivos JPEG, PNG o WebP');
            return;
        }

        setError(null);
        setUploading(true);

        try {
            const uploadedUrls = [];
            for (const file of validFiles) {
                const result = await api.uploadImage(file, token);
                uploadedUrls.push(result.url);
            }
            onChange([...images, ...uploadedUrls]);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleRemove = (index) => {
        const updated = images.filter((_, i) => i !== index);
        onChange(updated);
    };

    const handleReorder = (fromIndex, toIndex) => {
        const updated = [...images];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        onChange(updated);
    };

    return (
        <div>
            <label className="block text-sm font-medium mb-2">
                {label}
            </label>

            {/* Drop zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                    border: `2px dashed ${isDragging ? '#c9a962' : '#333'}`,
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: isDragging ? 'rgba(201, 169, 98, 0.08)' : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.2s ease',
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                    style={{ display: 'none' }}
                />

                {uploading ? (
                    <div style={{ color: '#c9a962' }}>
                        <svg
                            className="animate-spin mx-auto mb-2"
                            style={{ width: 28, height: 28 }}
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                        </svg>
                        <p style={{ fontSize: '14px' }}>Subiendo...</p>
                    </div>
                ) : (
                    <>
                        <svg
                            style={{ width: 36, height: 36, margin: '0 auto 8px', color: isDragging ? '#c9a962' : '#555' }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        <p style={{ fontSize: '14px', color: isDragging ? '#c9a962' : '#888', marginBottom: 4 }}>
                            Arrastrá imágenes aquí o hacé click para buscar
                        </p>
                        <p style={{ fontSize: '12px', color: '#555' }}>
                            JPEG, PNG, WebP — máx. 5 MB cada una
                        </p>
                    </>
                )}
            </div>

            {/* Error message */}
            {error && (
                <p style={{ color: '#ef4444', fontSize: '13px', marginTop: 8 }}>{error}</p>
            )}

            {/* Image previews */}
            {images.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                    gap: '10px',
                    marginTop: '12px',
                }}>
                    {images.map((url, index) => (
                        <div
                            key={url + index}
                            style={{
                                position: 'relative',
                                aspectRatio: '1',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                border: index === 0 ? '2px solid #c9a962' : '1px solid #2a2a2a',
                                background: '#111',
                            }}
                        >
                            <img
                                src={resolveImageUrl(url)}
                                alt={`Imagen ${index + 1}`}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />

                            {/* Thumbnail badge */}
                            {index === 0 && (
                                <span style={{
                                    position: 'absolute',
                                    bottom: 4,
                                    left: 4,
                                    background: '#c9a962',
                                    color: '#000',
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}>
                                    Portada
                                </span>
                            )}

                            {/* Action buttons */}
                            <div style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                display: 'flex',
                                gap: '3px',
                            }}>
                                {/* Move left (make thumbnail) */}
                                {index > 0 && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleReorder(index, 0); }}
                                        title="Hacer portada"
                                        style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: '5px',
                                            background: 'rgba(0,0,0,0.7)',
                                            border: 'none',
                                            color: '#c9a962',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '11px',
                                        }}
                                    >
                                        ★
                                    </button>
                                )}

                                {/* Remove */}
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
                                    title="Eliminar"
                                    style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: '5px',
                                        background: 'rgba(0,0,0,0.7)',
                                        border: 'none',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '13px',
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {images.length > 0 && (
                <p style={{ fontSize: '11px', color: '#555', marginTop: 6 }}>
                    La primera imagen (★ portada) se usa como miniatura en el catálogo
                </p>
            )}
        </div>
    );
}
