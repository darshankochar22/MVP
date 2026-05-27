interface Props {
    countLabel: string;
    backLabel?: string;
    onBack? : () => void;
}
 
export default function PageFooterBar ({ countLabel, backLabel = "Esc -> Back ", onBack}: Props){
    return(
        <div className="px-3 py-1.5 border-t border-zinc-200 bg-zinc-50 flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-wider shrink-0 select-none">
            <span>{countLabel}</span>
            {onBack && (
                <button onClick={onBack} className="hover:text-zinc-800 transition-colors">
                    {backLabel}
                </button>
            )}
        </div>
    );
}