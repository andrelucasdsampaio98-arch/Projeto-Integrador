import React, { useState } from 'react';
import { 
  Bot, 
  Check, 
  ExternalLink, 
  Play, 
  Sparkles, 
  MessageSquare, 
  Hand, 
  ShieldCheck, 
  Volume2, 
  RotateCcw,
  BookOpen,
  Keyboard,
  ChevronRight
} from 'lucide-react';
import { LIBRAS_ALPHABET, LIBRAS_NUMBERS } from '../../data/librasData';
import { HandSignSVG } from './HandSignSVG';

interface VLibrasWidgetProps {
  onSpeakText?: (text: string) => void;
}

export const VLibrasWidget: React.FC<VLibrasWidgetProps> = ({ onSpeakText }) => {
  const [inputText, setInputText] = useState('Olá professor, preciso de ajuda no laboratório.');
  const [highlightedText, setHighlightedText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'tradutor' | 'soletrador' | 'alfabeto'>('tradutor');

  // Speller states
  const [wordToSpell, setWordToSpell] = useState('MOUSE');
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);

  // Selected sign for detail card
  const [selectedSign, setSelectedSign] = useState(LIBRAS_ALPHABET[0]);

  // Clean letters for spelling
  const letters = wordToSpell.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').split('');
  const currentChar = letters[currentLetterIndex] || 'M';
  const currentSign =
    LIBRAS_ALPHABET.find((s) => s.letter === currentChar) ||
    LIBRAS_NUMBERS.find((s) => s.letter === currentChar) ||
    LIBRAS_ALPHABET[0];

  // Opens or toggles the official Government 3D avatar popup
  const openGovernmentAvatar = () => {
    const accessBtn = document.querySelector('[vw-access-button]') as HTMLElement;
    if (accessBtn) {
      accessBtn.click();
    } else {
      const vw = document.querySelector('[vw]') as HTMLElement;
      if (vw) {
        vw.classList.toggle('active');
      }
    }
  };

  const handleTranslateText = (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setHighlightedText(cleanText);
    if (onSpeakText) onSpeakText(cleanText);

    // Copy to clipboard
    navigator.clipboard.writeText(cleanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    // Open the 3D government avatar
    openGovernmentAvatar();
  };

  const quickLabPhrases = [
    'Bom dia professor!',
    'Preciso de ajuda com o código.',
    'O computador do laboratório travou.',
    'Posso ir ao banheiro?',
    'Terminei a atividade de programação.',
    'Muito obrigado pela explicação!',
  ];

  return (
    <div className="space-y-6">
      {/* Main Government 3D Avatar Card */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Header with Government Badge */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white font-black shadow-md">
              <Bot className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-black">
                  Boneco 3D do Governo Federal (VLibras)
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-black border border-slate-300 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Oficial Gov.br
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Avatar 3D oficial (Ícaro e Hozana) mantido pelo Governo Federal (MGI / UFPB / Lavid).
              </p>
            </div>
          </div>

          {/* Action Button: Open 3D Puppet on Screen */}
          <div className="flex items-center gap-2">
            <button
              onClick={openGovernmentAvatar}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-black transition shadow-sm hover:scale-105 active:scale-95"
            >
              <Bot className="h-4 w-4" />
              <span>Abrir Boneco 3D na Tela</span>
            </button>

            <a
              href="https://www.vlibras.gov.br/"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-black transition border border-slate-300"
              title="Acessar portal oficial do VLibras (vlibras.gov.br)"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Inner Sub-navigation (Tradutor 3D, Soletrador, Alfabeto Completo) */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-300 max-w-md">
          <button
            onClick={() => setActiveTab('tradutor')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 ${
              activeTab === 'tradutor'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            Tradutor 3D Gov
          </button>

          <button
            onClick={() => setActiveTab('soletrador')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 ${
              activeTab === 'soletrador'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black'
            }`}
          >
            <Keyboard className="h-3.5 w-3.5" />
            Soletrador
          </button>

          <button
            onClick={() => setActiveTab('alfabeto')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 ${
              activeTab === 'alfabeto'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Alfabeto & Números
          </button>
        </div>

        {/* TAB 1: TRADUTOR DIRETO DO BONECO 3D */}
        {activeTab === 'tradutor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5 flex items-center justify-between">
                  <span>Digite a frase para o Boneco 3D interpretar:</span>
                  <span className="text-[11px] text-slate-600 font-bold">
                    Libras oficial do Brasil
                  </span>
                </label>
                <div className="relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={3}
                    placeholder="Digite qualquer frase para o avatar 3D do governo sinalizar..."
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-2xl p-4 text-black font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black placeholder:text-slate-400 transition resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => handleTranslateText(inputText)}
                  disabled={!inputText.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white font-black text-xs transition shadow-sm disabled:opacity-40"
                >
                  <Play className="h-4 w-4 fill-white" />
                  Enviar para o Boneco 3D Traduzir
                </button>

                {copied && (
                  <span className="text-xs text-black font-black flex items-center gap-1 animate-pulse">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Texto enviado ao Boneco 3D!
                  </span>
                )}
              </div>

              {highlightedText && (
                <div
                  onClick={() => openGovernmentAvatar()}
                  className="p-4 rounded-2xl bg-slate-50 border-2 border-black text-black cursor-pointer hover:bg-slate-100 transition shadow-xs"
                  title="Clique para o Boneco 3D traduzir este texto"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold uppercase tracking-wider mb-1">
                    <span>Texto Enviado ao Boneco 3D:</span>
                    <span className="text-black font-black">Toque aqui para abrir a janela 3D</span>
                  </div>
                  <p className="text-base sm:text-lg font-black text-black select-all">
                    "{highlightedText}"
                  </p>
                </div>
              )}

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                  Frases rápidas para testar no Boneco do Governo:
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickLabPhrases.map((phrase, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputText(phrase);
                        handleTranslateText(phrase);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-black text-xs font-semibold transition"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-4 text-xs leading-relaxed text-slate-700">
              <div className="flex items-center gap-2 text-black font-black">
                <Sparkles className="h-4 w-4 text-black" />
                <h4>Como usar o Boneco 3D do Governo:</h4>
              </div>

              <ol className="space-y-2.5 list-decimal pl-4 text-slate-700">
                <li>
                  O ícone azul com as mãozinhas de Libras fica <strong>sempre visível no canto direito</strong> da tela.
                </li>
                <li>
                  Ao clicar no botão azul ou em <strong>"Abrir Boneco 3D na Tela"</strong>, abre-se a janela 3D com o avatar oficial <strong>Ícaro</strong>.
                </li>
                <li>
                  Basta <strong>selecionar qualquer texto com o mouse ou tocar nele</strong> no computador ou celular, e o avatar 3D começa a traduzir em sinais de Libras imediatamente.
                </li>
                <li>
                  Você pode trocar para a avatar feminina (<strong>Hozana</strong>), girar o boneco em 360 graus e mudar a velocidade dos sinais direto na janela 3D.
                </li>
              </ol>

              <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-black text-[11px] space-y-1">
                <strong className="block text-black font-black">🏛️ Projeto Integrador / Padrão Nacional:</strong>
                <p>
                  O VLibras é o padrão oficial de acessibilidade digital para a comunidade surda brasileira, mantido pelo Governo Federal e 100% gratuito.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SOLETRADOR DE PALAVRAS CONECTADO AO BONECO DO GOVERNO */}
        {activeTab === 'soletrador' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  Digite qualquer palavra para soletrar em Libras:
                </label>
                <input
                  type="text"
                  value={wordToSpell}
                  onChange={(e) => {
                    setWordToSpell(e.target.value.toUpperCase());
                    setCurrentLetterIndex(0);
                  }}
                  placeholder="Ex: MOUSE, TECLADO, PROJETO..."
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-black rounded-xl px-4 py-2.5 text-black font-black text-base tracking-widest uppercase focus:outline-none"
                />
              </div>

              <button
                onClick={() => handleTranslateText(wordToSpell)}
                className="px-5 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white font-black text-xs transition shadow-sm flex items-center gap-1.5 whitespace-nowrap"
              >
                <Bot className="h-4 w-4" />
                Soletrar no Boneco 3D do Gov
              </button>
            </div>

            {/* Letters Progression Bar */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                <span>Soletração letra por letra:</span>
                <span className="text-black font-bold">
                  Letra {currentLetterIndex + 1} de {letters.length || 1}
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {letters.map((char, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentLetterIndex(idx)}
                    className={`min-w-10 h-12 rounded-xl font-black text-base flex items-center justify-center transition border ${
                      idx === currentLetterIndex
                        ? 'bg-black text-white border-black scale-105 shadow-sm ring-2 ring-black'
                        : 'bg-white text-black border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>

            {/* Letter Sign Anatomical Card */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <HandSignSVG letterOrNumber={currentChar} size={110} />
              <div className="space-y-2 text-xs text-slate-700 text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xl font-black text-black px-3 py-1 rounded-xl bg-slate-200 border border-slate-300">
                    Letra {currentChar}
                  </span>
                  <button
                    onClick={() => {
                      if (onSpeakText) onSpeakText(`Letra ${currentChar}. ${currentSign.handShape}`);
                    }}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-black border border-slate-300 shadow-xs"
                    title="Ouvir descrição"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="font-bold text-black text-sm">{currentSign.handShape}</p>
                <p className="text-slate-600 leading-relaxed font-medium">{currentSign.description}</p>
                <p className="text-black italic font-semibold">{currentSign.exampleSentence}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ALFABETO COMPLETO & NÚMEROS */}
        {activeTab === 'alfabeto' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Alfabeto Dactilológico (A a Z) e Números (0 a 9)
              </span>
              <span className="text-[11px] text-slate-500">Toque em qualquer símbolo</span>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 max-h-72 overflow-y-auto pr-1">
              {LIBRAS_ALPHABET.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedSign(item);
                    setWordToSpell(item.letter || 'A');
                    setCurrentLetterIndex(0);
                    if (onSpeakText) onSpeakText(`Letra ${item.letter}. ${item.handShape}`);
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center transition group ${
                    selectedSign.letter === item.letter
                      ? 'bg-blue-50 border-blue-400 shadow-xs ring-2 ring-blue-400'
                      : 'bg-white hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <span className="text-sm font-black text-blue-700 group-hover:scale-110 transition">
                    {item.letter}
                  </span>
                  <HandSignSVG letterOrNumber={item.letter || 'A'} size={40} className="!p-0 border-0 bg-transparent" />
                </button>
              ))}

              {LIBRAS_NUMBERS.map((num) => (
                <button
                  key={num.id}
                  onClick={() => {
                    setSelectedSign(num);
                    setWordToSpell(num.letter || '0');
                    setCurrentLetterIndex(0);
                    if (onSpeakText) onSpeakText(`Número ${num.letter}. ${num.handShape}`);
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center transition group ${
                    selectedSign.letter === num.letter
                      ? 'bg-amber-50 border-amber-400 shadow-xs ring-2 ring-amber-400'
                      : 'bg-white hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <span className="text-sm font-black text-amber-700 group-hover:scale-110 transition">
                    {num.letter}
                  </span>
                  <HandSignSVG letterOrNumber={num.letter || '0'} size={40} className="!p-0 border-0 bg-transparent" />
                </button>
              ))}
            </div>

            {/* Selected Sign Details Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-4">
              <HandSignSVG letterOrNumber={selectedSign.letter || 'A'} size={80} />
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white font-black text-sm">
                    {selectedSign.letter}
                  </span>
                  <span className="text-slate-500 capitalize font-medium">{selectedSign.category}</span>
                </div>
                <p className="text-slate-900 font-bold">{selectedSign.handShape}</p>
                <p className="text-slate-600 leading-relaxed text-[11px]">{selectedSign.description}</p>
                <p className="text-blue-700 text-[11px] italic font-semibold">{selectedSign.exampleSentence}</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <span className="text-amber-800 font-bold">Dica da Regra:</span>
              <span>
                Para não confundir: na letra <strong>F</strong> o polegar fica por <strong>Fora</strong>; na letra <strong>T</strong> o polegar fica por <strong>Trás/Dentro</strong>.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
