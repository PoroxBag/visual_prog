import { useState } from "react";

type Props = {
  defaultValue: string;
  onSearch: (city: string) => void;
  loading: boolean;
};

export function CitySearch({ defaultValue, onSearch, loading }: Props) {
  const [value, setValue] = useState(defaultValue);

  return (
    <form
      className="search-bar"
      onSubmit={(e) => {
        e.preventDefault();
        const city = value.trim();
        if (city) onSearch(city);
      }}
    >
      <input
        className="search-bar__input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Введите город"
      />
      <button className="search-bar__button" disabled={loading} type="submit">
        {loading ? "Загрузка..." : "Показать"}
      </button>
    </form>
  );
}