import { Favorite } from '../favorites/entities/favorite.entity';
import { Movie } from '../movies/entities/movie.entity';
import { Rating } from '../ratings/entities/rating.entity';
import { User } from '../users/entities/user.entity';
import { WatchlistItem } from '../watchlist/entities/watchlist-item.entity';

export const entities = [User, Movie, Favorite, Rating, WatchlistItem];
