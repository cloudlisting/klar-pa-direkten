import Layout from "@/components/Layout";
import TaskCard from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MOCK_TASKS, MOCK_CATEGORIES, SWEDISH_CITIES } from "@/lib/mock-data";
import { Search, SlidersHorizontal, MapPin, X } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BrowseTasks = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = MOCK_TASKS.filter((task) => {
    const matchesSearch = !search || task.title.toLowerCase().includes(search.toLowerCase()) || task.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || task.category === MOCK_CATEGORIES.find(c => c.id === selectedCategory)?.name;
    const matchesCity = selectedCity === "all" || task.location === selectedCity;
    return matchesSearch && matchesCategory && matchesCity;
  });

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedCity("all");
  };

  const hasActiveFilters = search || selectedCategory !== "all" || selectedCity !== "all";

  return (
    <Layout>
      <div className="bg-secondary/50 border-b border-border">
        <div className="container py-8">
          <h1 className="text-3xl font-bold font-display text-foreground mb-2">
            Hitta uppdrag
          </h1>
          <p className="text-muted-foreground mb-6">
            {filtered.length} uppdrag tillgängliga
          </p>

          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Sök uppdrag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12 bg-card"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="lg"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filter</span>
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 flex flex-wrap gap-3 items-end">
              <div className="w-48">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Kategori</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alla kategorier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla kategorier</SelectItem>
                    {MOCK_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Stad</label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alla städer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla städer</SelectItem>
                    {SWEDISH_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        <span className="flex items-center gap-1"><MapPin size={12} /> {city}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                  <X size={14} /> Rensa
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground mb-2">Inga uppdrag matchade din sökning</p>
            <Button variant="outline" onClick={clearFilters}>Rensa filter</Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BrowseTasks;
