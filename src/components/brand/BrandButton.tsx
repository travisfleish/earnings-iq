"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { useState, type HTMLAttributes } from "react";

type BrandButtonProps = {
  link?: {
    title: string;
    url: string;
  };
  button?: {
    background_color?: "navy" | "white" | "lightGrey" | "lavenderGrey" | "white-alt" | "white15" | "navy5" | string;
    type?: "solid" | "slim" | "default" | "outline" | "header" | string;
  };
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
} & HTMLAttributes<HTMLDivElement>;

const backgroundColorMap: Record<string, string> = {
  navy: "bg-navy",
  white: "bg-white",
  "light-grey": "bg-navy/[0.05] text-navy hover:bg-blue hover:text-white",
  lightGrey: "bg-lightGrey",
  lavenderGrey: "bg-lavenderGrey",
  white15: "bg-white/15",
  navy5: "bg-navy/5",
};

const typeMap: Record<string, string> = {
  default: "px-[36px] sm:px-12 py-[15px] md:py-4.25 rounded-[125rem] text-17",
  slim: "px-5 py-3 rounded-[125rem] text-16",
  header: "px-12 py-4 rounded-full font-medium !leading-none lg:px-5 lg:py-[.8rem] lg:text-[1rem]",
  outline:
    "px-12 py-4.25 rounded-[125rem] font-semibold text-17 border border-lavenderGrey hover:border-lightBlue",
};

const textColorMap: Record<string, { initial: string; hover: string }> = {
  "white-alt": { initial: "text-blue font-semibold", hover: "text-blue font-semibold" },
  white: { initial: "text-navy", hover: "text-blue" },
  navy: { initial: "text-white", hover: "text-white" },
  lightGrey: { initial: "text-black", hover: "text-white" },
  lavenderGrey: { initial: "text-navy", hover: "text-white" },
  white15: { initial: "text-white", hover: "text-blue" },
  navy5: { initial: "text-navy", hover: "text-white" },
};

const linesColorMap: Record<string, string> = {
  "white-alt": "bg-lightBlue",
  white: "bg-lightBlue",
  navy: "bg-blue",
  lightGrey: "bg-blue",
  lavenderGrey: "bg-blue",
  white15: "bg-lightBlue",
  navy5: "bg-blue",
};

export function BrandButton({
  link,
  button,
  className = "",
  onClick = () => {},
  onMouseEnter = () => {},
  onMouseLeave = () => {},
  ...other
}: BrandButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const backgroundColor = button?.background_color || "navy";
  const buttonType = button?.type || "solid";
  const classes = clsx(
    "transition-colors relative duration-300 ease-in-out text-center",
    buttonType === "header" ? "font-heading" : "font-body",
    typeMap[buttonType],
    className,
  );
  const blockBgColor = buttonType === "outline" || backgroundColor === "white-alt";
  const splitWords = link?.title?.split(" ");

  if (!link?.title) return null;

  return (
    <motion.div
      onClick={onClick}
      initial="initial"
      whileHover="hovered"
      onMouseEnter={() => {
        setIsHovered(true);
        onMouseEnter();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onMouseLeave();
      }}
      className={clsx(
        "relative cursor-pointer overflow-hidden rounded-[125rem]",
        !blockBgColor && backgroundColorMap[backgroundColor],
        backgroundColor === "white-alt" && backgroundColorMap.white,
      )}
    >
      <div
        style={{ transform: "translateZ(0)" }}
        className="absolute inset-0 flex h-full flex-col overflow-hidden rounded-full"
      >
        {new Array(4).fill(0).map((_, index) => (
          <motion.div
            key={`line-${index}`}
            initial={{ x: index % 2 === 0 ? "-101%" : "101%" }}
            animate={{
              x: !isHovered ? (index % 2 === 0 ? "-101%" : "101%") : "0%",
              transition: {
                duration: !isHovered ? 0.3 : 0.4,
                delay: index * 0.1,
                ease: "easeInOut",
              },
            }}
            className={clsx(
              "z-10 flex-1",
              buttonType !== "outline" && linesColorMap[backgroundColor],
              buttonType === "outline" && "bg-lightBlue",
            )}
          />
        ))}
      </div>

      <div className={classes} {...other}>
        <div
          className={clsx(
            "button__initial-text relative z-30 overflow-hidden whitespace-nowrap",
            buttonType !== "outline" && textColorMap[backgroundColor]?.initial,
            buttonType === "outline" && "text-navy",
          )}
        >
          {splitWords?.map((word, i) => {
            const isLastWord = i === splitWords.length - 1;
            const accumulatedDelay =
              splitWords.slice(0, i).reduce((acc, curr) => acc + curr.length, 0) * 0.025;
            return (
              <p key={`initial-word-${i}`} className="inline-block">
                {word?.split("").map((letter, ind) => (
                  <motion.span
                    className="inline-block"
                    variants={{ initial: { y: 0, opacity: 1 }, hovered: { y: "-100%", opacity: 0 } }}
                    transition={{
                      duration: 0.25,
                      ease: "easeInOut",
                      delay: accumulatedDelay + ind * 0.025,
                    }}
                    key={`initial-${letter}-${ind}`}
                  >
                    {letter}
                  </motion.span>
                ))}
                {!isLastWord && <span>&nbsp;</span>}
              </p>
            );
          })}
        </div>
      </div>

      <div className={clsx(classes, "!absolute inset-0 z-20")} {...other}>
        <div
          className={clsx(
            "button__hover-text overflow-hidden whitespace-nowrap",
            buttonType !== "outline" && textColorMap[backgroundColor]?.hover,
            buttonType === "outline" && "text-navy",
          )}
        >
          {splitWords?.map((word, i) => {
            const isLastWord = i === splitWords.length - 1;
            const accumulatedDelay =
              splitWords.slice(0, i).reduce((acc, curr) => acc + curr.length, 0) * 0.025;
            return (
              <p key={`hover-${word}-${i}`} className="inline-block">
                {word?.split("").map((letter, ind) => (
                  <motion.span
                    className="inline-block"
                    variants={{ initial: { y: "100%", opacity: 0 }, hovered: { y: 0, opacity: 1 } }}
                    transition={{
                      duration: 0.25,
                      ease: "easeInOut",
                      delay: accumulatedDelay + ind * 0.025,
                    }}
                    key={`hover-${letter}-${ind}`}
                  >
                    {letter}
                  </motion.span>
                ))}
                {!isLastWord && <span>&nbsp;</span>}
              </p>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
