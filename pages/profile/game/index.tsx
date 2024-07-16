import React, { useEffect } from "react";
import GameListCard from "../../../components/Game/GameListCard";
import Layout from "../../../components/Layouts";
import { trpc } from "../../../utils/trpc";
import Loading from "../../../components/Shared/Indicators/Loading";
import { useBitkubNext } from "../../../contexts/bitkubNextContext";
import { useRouter } from "next/router";

const GameList = () => {
  const { replace } = useRouter();
  const { isConnected } = useBitkubNext();
  const { data: games, isLoading: loadingGames } =
    trpc.game.getAllGame.useQuery();

  useEffect(() => {
    if (!isConnected) {
      void replace("/profile");
    }
  }, [isConnected]);

  return (
    <Layout>
      <div className="p-2">
        <div className="grid grid-cols-1 gap-2">
          {!loadingGames && games ? (
            games.map((game) => (
              <GameListCard
                key={game._id}
                _id={game._id}
                title={game.title}
                thumbnailImage={game.image}
                description={game.description}
                type={game.type}
              />
            ))
          ) : (
            <div>
              {!loadingGames && !games ? (
                <div>No Game</div>
              ) : (
                <Loading size="lg" />
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default GameList;
