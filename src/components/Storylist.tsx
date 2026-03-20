"use client";

import { addStory } from "@/lib/actions";
import { useUser } from "@clerk/nextjs";
import { Story, User } from "@prisma/client";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { useOptimistic, useState } from "react";

type StoryWithUser = Story & {
  user: User;
};

const StoryList = ({
  stories,
  userId,
}: {
  stories: StoryWithUser[];
  userId: string;
}) => {
  const [storyList, setStoryList] = useState(stories);
  const [img, setImg] = useState<{ secure_url?: string } | null>(null);

  const { user, isLoaded } = useUser();

  const [optimisticStories, addOptimisticStory] = useOptimistic(
    storyList,
    (state, value: StoryWithUser) => [value, ...state]
  );

  if (!isLoaded) return null;

  const handleAddStory = async () => {
    if (!img?.secure_url) return;

    addOptimisticStory({
      id: Math.random(),
      img: img.secure_url,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      userId: userId,
      user: {
        id: userId,
        username: "Sending...",
        avatar: user?.imageUrl || "/noAvatar.png",
        cover: "",
        description: "",
        name: "",
        surname: "",
        city: "",
        work: "",
        school: "",
        website: "",
        createdAt: new Date(),
      },
    });

    try {
      const createdStory = await addStory(img.secure_url);
      if (createdStory) {
        setStoryList((prev) => [createdStory, ...prev]);
      }
      setImg(null);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      {/* ADD STORY */}
      <CldUploadWidget
        uploadPreset="social"
        onSuccess={(result: any, { widget }) => {
          setImg(result.info);
          widget.close();
        }}
      >
        {({ open }) => (
          <div className="flex flex-col items-center gap-2 cursor-pointer relative">
            <Image
              src={img?.secure_url || user?.imageUrl || "/noAvatar.png"}
              alt=""
              width={80}
              height={80}
              className="w-20 h-20 rounded-full ring-2 object-cover"
              onClick={() => open()}
            />

            {img ? (
              <button
                onClick={handleAddStory}
                className="text-xs bg-blue-500 p-1 rounded-md text-white"
              >
                Send
              </button>
            ) : (
              <span className="font-medium">Add a Story</span>
            )}

            {/* FIX: không block click */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 text-6xl text-gray-200 pointer-events-none">
              +
            </div>
          </div>
        )}
      </CldUploadWidget>

      {/* STORY LIST */}
      {optimisticStories.map((story) => (
        <div
          key={story.id}
          className="flex flex-col items-center gap-2 cursor-pointer"
        >
          <Image
            src={story.user.avatar || "/noAvatar.png"}
            alt=""
            width={80}
            height={80}
            className="w-20 h-20 rounded-full ring-2 object-cover"
          />
          <span className="font-medium">
            {story.user.name || story.user.username}
          </span>
        </div>
      ))}
    </>
  );
};

export default StoryList;