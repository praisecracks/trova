import React, { useState } from 'react';
import { Trash2, Star } from 'lucide-react';
import { RatingRecord } from '../../types';

interface RatingsTabProps {
  ratings: RatingRecord[];
  theme?: 'dark' | 'light';
  refreshData: () => void;
}

export function RatingsTab({ ratings, theme, refreshData }: RatingsTabProps) {
  const isLight = theme === 'light';
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (ratingId: string) => {
    if (!confirm('Are you sure you want to delete this rating? This action cannot be undone.')) return;
    setDeletingId(ratingId);
    try {
      const { deleteRating } = await import('../../lib/services/admin');
      const success = await deleteRating(ratingId);
      if (success) {
        refreshData();
      } else {
        alert('Failed to delete rating');
      }
    } catch (err) {
      alert('Error deleting rating');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>Ratings & Reviews</h2>
          <p className={`text-sm ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Manage seller ratings and remove fraudulent reviews</p>
        </div>
      </div>

      <div className={`border rounded-xl overflow-hidden ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
        {ratings.length === 0 ? (
          <div className={`p-8 text-center ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
            <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No ratings found</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b ${isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                <th className="py-3 px-4 font-semibold">Rating</th>
                <th className="py-3 px-4 font-semibold">Comment</th>
                <th className="py-3 px-4 font-semibold">Transaction</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-zinc-200' : 'divide-zinc-800'}`}>
              {ratings.map((rating) => (
                <tr key={rating.id} className={`hover:bg-zinc-50 ${isLight ? 'hover:bg-zinc-50' : 'hover:bg-zinc-900/50'}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span className={`font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>{rating.score}</span>
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    </div>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <p className={`truncate ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                      {rating.comment || 'No comment'}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-mono ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {rating.transactionId?.slice(0, 8)}...
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(rating.id)}
                      disabled={deletingId === rating.id}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                      title="Delete rating"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
