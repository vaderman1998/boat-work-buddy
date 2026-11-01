import { NavLink } from 'react-router-dom';
import { Package, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function MainMenu() {
  return <nav aria-label="Main menu" className="flex gap-2 flex-wrap py-4">
    {[{to:'/',label:'Jobs',Icon:Wrench},{to:'/inventory',label:'Inventory',Icon:Package}].map(({to,label,Icon}) => <NavLink key={to} to={to} end>{({isActive}) => <Button asChild variant={isActive ? 'default' : 'outline'}><span><Icon className="h-4 w-4 mr-2" />{label}</span></Button>}</NavLink>)}
  </nav>;
}
