cl.exe test.cpp /Fetest ^
  /I "%CUDA_PATH%\include" /I "%NVCUDASAMPLES_ROOT%\common\inc" ^
  "%CUDA_PATH%"\lib\x64\nvrtc.lib "%CUDA_PATH%"\lib\x64\cuda.lib "%CUDA_PATH%"\lib\x64\cudart.lib