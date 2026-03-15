/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI, Type } from "@google/genai";
import {
  Camera,
  Upload,
  ShieldCheck,
  ShieldAlert,
  Info,
  Search,
  Package,
  MapPin,
  Globe,
  Calendar,
  Tag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function App() {
  const [image, setImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [dbProduct, setDbProduct] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isExplanation, setIsExplanation] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [isSearchingAlternatives, setIsSearchingAlternatives] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('upload');
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef(null);

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsProcessing(true);
    setError(null);
    setExtracted(null);
    setDbProduct(null);
    setIsExplanation(null);
    setSimilarProducts([]);
    setStep('results');

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const product = await response.json();
        setDbProduct(product);
        setExtracted({
          rNumber: product.registration_number,
          isNumber: product.is_number,
          productName: product.product_name,
          brand: product.brand
        });

        // Use placeholder image for manual search
        setImage(`https://picsum.photos/seed/${product.brand}/800/800`);

        explainISNumber(product.is_number);
        findSimilarProducts(product.product_name, product.brand);
      } else {
        const errData = await response.json();
        setError(errData.error || "No product found matching your search.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while searching. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        processImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64Image) => {
    setIsProcessing(true);
    setError(null);
    setExtracted(null);
    setDbProduct(null);
    setIsExplanation(null);
    setSimilarProducts([]);
    setStep('results');

    try {
      const model = "gemini-3-flash-preview";
      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image.split(',')[1],
        },
      };

      // 1. Extract details from image
      const extractionResponse = await genAI.models.generateContent({
        model,
        contents: {
          parts: [
            imagePart,
            { text: "Extract the BIS Registration Number (R-number, e.g., R-41000001), IS Number (e.g., IS 13252), Product Name, and Brand from this product label. Return in JSON format with keys: rNumber, isNumber, productName, brand. If not found, use null." }
          ]
        },
        config: { responseMimeType: "application/json" }
      });

      const extractedData = JSON.parse(extractionResponse.text);
      setExtracted(extractedData);

      if (extractedData.rNumber) {
        // 2. Check Database
        const dbResponse = await fetch(`/api/products/${extractedData.rNumber}`);
        if (dbResponse.ok) {
          const product = await dbResponse.json();
          setDbProduct(product);

          // 3. Explain IS Number
          explainISNumber(product.is_number);

          // 4. Find Similar Products
          findSimilarProducts(product.product_name, product.brand);
        } else {
          setError("R-Number not found in our authenticated database. This product might not be genuine or registered.");
        }
      } else {
        setError("Could not find a valid R-Number on the label. Please ensure the BIS mark and R-number are clearly visible.");
      }

    } catch (err) {
      console.error(err);
      setError("An error occurred while processing the image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const explainISNumber = async (isNumber) => {
    setIsExplaining(true); // Start loader
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Explain what the Indian Standard ${isNumber} says, what it is for, and its key standards in a concise manner. Also in the bottom line for each verified standard, provide one simple safety explanation derived form the BIS standard.`
      });
      setIsExplanation(response.text);
    } catch (err) {
      console.error("Error explaining IS number:", err);
    } finally {
      setIsExplaining(false); // Stop loader
    }
  };

  const findSimilarProducts = async (productName, brand) => {
    setIsSearchingAlternatives(true);
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find 3 similar products to "${brand} ${productName}" that are also BIS certified (have an R-number). For each, provide the name, brand, and a placeholder R-number. Format as a JSON array of objects with keys: name, brand, rNumber, url.`,
        // config: { 
        //   tools: [{ googleSearch: {} }],
        //   responseMimeType: "application/json",
        //   responseSchema: {
        //     type: Type.ARRAY,
        //     items: {
        //       type: Type.OBJECT,
        //       properties: {
        //         name: { type: Type.STRING },
        //         brand: { type: Type.STRING },
        //         rNumber: { type: Type.STRING },
        //         url: { type: Type.STRING }
        //       }
        //     }
        //   }
        // }
        config: {
          responseMimeType: "application/json"
        }
      });
      setSimilarProducts(JSON.parse(response.text));
    } catch (err) {
      console.error("Error finding similar products:", err);
    } finally {
      setIsSearchingAlternatives(false); // Stop loader
    }
  };

  const reset = () => {
    setImage(null);
    setStep('upload');
    setExtracted(null);
    setDbProduct(null);
    setIsExplanation(null);
    setSimilarProducts([]);
    setError(null);
    setSearchQuery('');
    setIsSearchingAlternatives(false);
    setIsExplaining(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">BIS Authenticator</h1>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Bureau of Indian Standards</p>
          </div>
        </div>
        {step === 'results' && (
          <button
            onClick={reset}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
          >
            Scan New <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {step === 'upload' ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 tracking-tight">Verify Your Product</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  Scan the BIS label or manually search for R-Numbers and IS-Numbers to verify authenticity.
                </p>
              </div>

              {/* Manual Search Bar */}
              <form
                onSubmit={handleManualSearch}
                className="w-full max-w-lg mb-8 relative group"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter R-Number (e.g. R-41000001) or IS-Number..."
                  className="w-full bg-white border-2 border-gray-100 rounded-2xl px-6 py-4 pl-14 focus:border-emerald-500 focus:ring-0 transition-all shadow-sm group-hover:shadow-md outline-none"
                />
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                >
                  Search
                </button>
              </form>

              <div className="flex items-center gap-4 w-full max-w-lg mb-8">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">OR</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative w-full max-w-lg aspect-[4/3] bg-white rounded-3xl border-2 border-dashed border-gray-200 hover:border-emerald-500 transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-50"
              >
                <div className="flex flex-col items-center gap-4 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                    <Camera className="w-10 h-10" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">Click to Upload or Scan</p>
                    <p className="text-sm text-gray-400">Supports JPG, PNG (Max 50MB)</p>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>

              <div className="mt-12 grid grid-cols-3 gap-8 w-full max-w-2xl">
                {[
                  { icon: ShieldCheck, title: "Authenticity", desc: "Verify R-Numbers" },
                  { icon: Info, title: "Standards", desc: "Understand IS Codes" },
                  { icon: Search, title: "Discovery", desc: "Find Verified Alternatives" }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-gray-400">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{item.title}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8 pb-20"
            >
              {/* Status Banner */}
              <div className={`p-6 rounded-3xl flex items-center gap-4 ${isProcessing ? 'bg-blue-50 text-blue-700' :
                  error ? 'bg-red-50 text-red-700' :
                    'bg-emerald-50 text-emerald-700'
                }`}>
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : error ? (
                  <ShieldAlert className="w-8 h-8" />
                ) : (
                  <ShieldCheck className="w-8 h-8" />
                )}
                <div>
                  <h3 className="font-bold text-lg">
                    {isProcessing ? "Analyzing Label..." : error ? "Verification Failed" : "Product Authenticated"}
                  </h3>
                  <p className="text-sm opacity-80">
                    {isProcessing ? "Extracting BIS details and checking database..." :
                      error ? error : "This product is registered with the Bureau of Indian Standards."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Image & Extracted */}
                <div className="md:col-span-1 space-y-6">
                  <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Scanned Label</p>
                    <img
                      src={image || undefined}
                      alt="Product Label"
                      className="w-full rounded-2xl aspect-square object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Extracted Data</p>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">R-Number</span>
                        <span className="font-mono text-xs font-bold bg-gray-100 px-2 py-1 rounded">{extracted?.rNumber || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">IS-Number</span>
                        <span className="font-mono text-xs font-bold bg-gray-100 px-2 py-1 rounded">{extracted?.isNumber || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Brand</span>
                        <span className="text-xs font-bold">{extracted?.brand || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: DB Details & Explanation */}
                <div className="md:col-span-2 space-y-6">
                  {dbProduct && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                      <div className="bg-emerald-600 p-6 text-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-2xl font-bold">{dbProduct.product_name}</h2>
                            <p className="text-emerald-100 text-sm">{dbProduct.brand}</p>
                          </div>
                          <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            {dbProduct.status}
                          </div>
                        </div>
                      </div>

                      <div className="p-6 grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Manufacturer
                          </p>
                          <p className="text-sm font-semibold">{dbProduct.manufacturer_name}</p>
                          <p className="text-xs text-gray-500">{dbProduct.manufacturer_address}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Validity
                          </p>
                          <p className="text-sm font-semibold">Until {dbProduct.validity}</p>
                          <p className="text-xs text-gray-500">Granted: {dbProduct.license_grant_date}</p>
                        </div>
                        {/* <div className="col-span-2 pt-4 border-t border-gray-50">
                          <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Scope of License</p>
                          <p className="text-sm text-gray-600 leading-relaxed">{dbProduct.scope_of_license}</p>
                        </div> */}
                      </div>
                    </motion.div>
                  )}

                  {(isExplaining || isExplanation) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
                    >
                      {/* Header Section */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                          {isExplaining ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Info className="w-4 h-4" />
                          )}
                        </div>
                        <h3 className="font-bold">
                          {isExplaining ? `Analyzing ${dbProduct?.is_number}...` : `Understanding ${dbProduct?.is_number}`}
                        </h3>
                      </div>

                      {/* Content Section */}
                      <div className="prose prose-sm prose-emerald max-w-none text-gray-600 leading-relaxed max-h-[400px] overflow-auto">
                        {isExplaining ? (
                          /* Skeleton Loader while fetching */
                          <div className="space-y-4">
                            <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
                            <div className="h-4 bg-gray-100 rounded w-11/12 animate-pulse"></div>
                            <div className="h-20 bg-gray-50 rounded-2xl w-full animate-pulse"></div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                              <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                            </div>
                          </div>
                        ) : (
                          /* Rendered Markdown from API */
                          <ReactMarkdown
                            components={{
                              h3: ({ node, ...props }) => <h3 className="text-gray-900 font-bold mt-6 mb-3 flex items-center gap-2 border-l-4 border-emerald-500 pl-3" {...props} />,
                              hr: ({ node, ...props }) => <hr className="my-8 border-gray-100" {...props} />,
                              strong: ({ node, ...props }) => <strong className="text-emerald-700 font-semibold" {...props} />,
                              ul: ({ node, ...props }) => <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 list-none p-0" {...props} />,
                              li: ({ node, ...props }) => (
                                <li className="flex items-start gap-2 before:content-['✓'] before:text-emerald-500 before:font-bold before:text-xs before:mt-1">
                                  <span {...props} />
                                </li>
                              ),
                            }}
                          >
                            {isExplanation}
                          </ReactMarkdown>
                        )}
                      </div>

                      {!isExplaining && (
                        <div className="mt-8 pt-4 border-t border-gray-50 flex items-center gap-2 text-[10px] text-gray-400 italic">
                          <Info className="w-3 h-3" />
                          Information synthesized by AI based on BIS technical documentation.
                        </div>
                      )}
                    </motion.div>
                  )}

                  {(isSearchingAlternatives || similarProducts.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <Search className={`w-5 h-5 ${isSearchingAlternatives ? 'text-blue-500 animate-pulse' : 'text-emerald-600'}`} />
                        {isSearchingAlternatives ? "Finding Verified Alternatives..." : "Verified Alternatives"}
                      </h3>

                      <div className="grid grid-cols-1 gap-4">
                        {isSearchingAlternatives ? (
                          // Skeleton Loader: Repeat 3 times
                          [1, 2, 3].map((i) => (
                            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between animate-pulse">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl"></div>
                                <div className="space-y-2">
                                  <div className="h-4 bg-gray-100 rounded w-32"></div>
                                  <div className="h-3 bg-gray-50 rounded w-24"></div>
                                </div>
                              </div>
                              <div className="w-10 h-10 bg-gray-50 rounded-full"></div>
                            </div>
                          ))
                        ) : (
                          // Actual Content
                          similarProducts.map((prod, i) => (
                            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-emerald-200 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                  <Package className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="font-bold text-sm">{prod.name}</p>
                                  <p className="text-xs text-gray-400">{prod.brand} • {prod.rNumber}</p>
                                </div>
                              </div>
                              <a
                                href={prod.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
