import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PropertiesPage() {
    // MOCK DATA
    const assets = [
        {
            id: "1",
            name: "Apartamento Jardins",
            address: "Rua Oscar Freire, 1200",
            city: "São Paulo",
            state: "SP",
            type: "Apartamento",
            status: "RENTED",
            value: 1250000,
            rentValue: 5500,
        },
        {
            id: "2",
            name: "Casa de Campo",
            address: "Estrada do Vinho, km 4",
            city: "São Roque",
            state: "SP",
            type: "Casa",
            status: "VACANT",
            value: 850000,
            rentValue: 0,
        },
        {
            id: "3",
            name: "Sala Comercial Faria Lima",
            address: "Av. Brigadeiro Faria Lima, 4500",
            city: "São Paulo",
            state: "SP",
            type: "Comercial",
            status: "RENTED",
            value: 2100000,
            rentValue: 12000,
        },
    ];

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Imóveis</h2>
                <Button asChild>
                    <Link href="/properties/new">
                        <Plus className="mr-2 h-4 w-4" /> Novo Ativo
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Gerenciar Ativos</CardTitle>
                    <div className="flex items-center space-x-2 pt-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar por nome ou endereço..."
                                className="pl-8"
                            />
                        </div>
                        <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome / Endereço</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Localização</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Valor Mercado</TableHead>
                                <TableHead className="text-right">Aluguel</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assets.map((asset) => (
                                <TableRow key={asset.id}>
                                    <TableCell>
                                        <div className="font-medium">{asset.name}</div>
                                        <div className="text-sm text-muted-foreground">{asset.address}</div>
                                    </TableCell>
                                    <TableCell>{asset.type}</TableCell>
                                    <TableCell>{asset.city}/{asset.state}</TableCell>
                                    <TableCell>
                                        <Badge variant={asset.status === 'RENTED' ? 'default' : 'secondary'}>
                                            {asset.status === 'RENTED' ? 'Alugado' : 'Vago'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.value)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {asset.rentValue > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.rentValue) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm">Editar</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
