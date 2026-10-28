import { Wallet } from "lucide-react";
import Link from "next/link";


export function Header(){
    return(
        <header className="w-full max-w-7xl min-h-5 bg-blue-900 mx-auto mt-2 rounded-xl p-3">
            <h1 className=" flex gap-2 items-center text-white font-bold text-2xl">
                <Wallet size={26} color="rgb(0, 165, 241)"/>
                 <Link href="/">FinTrack</Link>
            </h1>
            <p className="text-white mt-2">Controle financeiro pessoal</p>
        </header>

    )
}