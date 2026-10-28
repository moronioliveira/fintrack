import { Wallet } from "lucide-react";
import Link from "next/link";


export function Header(){
    return(
        <header className="w-full min-h-5 bg-blue-900 p-3">
            <div className="max-w-7xl mx-auto">
                <h1 className=" flex gap-2 items-center text-white font-bold text-2xl">
                <Wallet size={26} color="rgb(0, 165, 241)"/>
                 <Link href="/">FinTrack</Link>
            </h1>
            <p className="text-white mt-2">Controle financeiro pessoal</p>
            </div>
        </header>

    )
}