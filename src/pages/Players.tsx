// In Players.tsx, add pagination
const [page, setPage] = useState(1);
const playersPerPage = 50;

const paginatedPlayers = filteredPlayers.slice(
  (page - 1) * playersPerPage,
  page * playersPerPage
);

const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);

// In the JSX, replace the map with paginatedPlayers
{paginatedPlayers.map((player, index) => (
  // ... player row
))}

// Add pagination controls
<div className="flex justify-center gap-2 mt-4">
  <Button 
    disabled={page <= 1} 
    onClick={() => setPage(p => p - 1)}
  >
    Previous
  </Button>
  <span className="py-2 px-4">
    Page {page} of {totalPages} ({filteredPlayers.length} players)
  </span>
  <Button 
    disabled={page >= totalPages} 
    onClick={() => setPage(p => p + 1)}
  >
    Next
  </Button>
</div>
