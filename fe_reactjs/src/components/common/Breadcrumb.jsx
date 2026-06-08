import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumb = ({ items }) => {
    return (
        <nav className="breadcrumb py-4 bg-slate-50 mb-8">
            <div className="max-w-7xl mx-auto px-4">
                <ul className="flex items-center gap-2 text-sm text-slate-500 overflow-x-auto whitespace-nowrap">
                    <li className="flex items-center gap-2">
                        <Link to="/" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                            <Home size={14} />
                            Trang chủ
                        </Link>
                    </li>
                    {items.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                            <ChevronRight size={14} className="text-slate-300" />
                            {item.link ? (
                                <Link to={item.link} className="hover:text-indigo-600 transition-colors">
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="text-slate-900 font-medium">{item.label}</span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
};

export default Breadcrumb;
