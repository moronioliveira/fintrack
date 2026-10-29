export default function Configuracoes(){
    return(
        <div className="space-y-7">
            <div>
                <p className="mb-2 text-sm font-medium text-blue-400">Preferências</p>
                <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                <p className="mt-2 text-sm text-slate-500">Ajuste sua experiência no FinTrack.</p>
            </div>
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-6">
                <p className="text-sm font-semibold text-blue-300">Configurações em desenvolvimento</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                    Em breve você poderá personalizar seu perfil, moeda, aparência e preferências de notificações.
                </p>
            </div>
        </div>
    )
}